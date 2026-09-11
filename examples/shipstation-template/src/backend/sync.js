/**
 * Idempotent Digit ↔ ShipStation order sync.
 */

import { AppErrorCode } from '@digit/lib-common';
import { requireEnv } from '@digit/lib-backend';

import { afterDigitShipped } from './channels/index.js';
import { digitGraphql } from './digitGraphql.js';
import { appendActivity } from './activity.js';
import {
  COMPANIES_SEARCH_QUERY,
  CREATE_COMPANY_LOCATION_MUTATION,
  CREATE_COMPANY_MUTATION,
  CREATE_ORDER_MUTATION,
  CREATE_PACK_CONTAINER_MUTATION,
  CREATE_SHIPMENT_MUTATION,
  ITEMS_BY_SEARCH_QUERY,
  ORDER_BY_ID_QUERY,
  SHIPMENT_BY_ID_QUERY,
  SHIPMENT_LIST_QUERY,
  UPDATE_SHIPMENT_MUTATION,
} from './digitQueries.js';
import { ineligibilityReason, skipNextStep } from './eligibility.js';
import { digitShipmentToShipment, orgShipFrom } from './mappers/digitToShipStation.js';
import { digitShipmentToV1Order } from './mappers/digitToShipStationV1.js';
import {
  normalizeSsRecord,
  normalizedToImportShipment,
} from './mappers/normalizeSsRecord.js';
import {
  ssBillingAddressInput,
  ssCompanyName,
  ssLineSkus,
  ssShipToLocationInput,
} from './mappers/shipStationToDigit.js';
import { resolveShipStationCredentials } from './runtimeConfig.js';
import {
  createShipments,
  fetchResourceUrl,
  getLabel,
  getShipment,
  getShipmentByExternalId,
  listShipments,
} from './shipstation.js';

export async function liveConnection({ db, organizationId }) {
  return db
    .prepare(
      `SELECT id, organization_id, api_version, created_at, updated_at
       FROM shipstation_connection
       WHERE organization_id = ? AND deleted = 0
       LIMIT 1`,
    )
    .bind(organizationId)
    .first();
}

/**
 * Live ShipStation credentials for a connected org.
 * Secrets come from Digit app secrets only. Legacy `api_key_encrypted` on the
 * connection row is not used here — removing the Digit secret must clear
 * operable/connected UI (disconnect still reads ciphertext to deregister webhooks).
 *
 * @returns {Promise<null | {
 *   connectionId: number,
 *   apiVersion: 'v1' | 'v2',
 *   apiKey?: string,
 *   apiSecret?: string,
 *   mismatch?: string,
 * }>}
 */
export async function liveCredentials({ db, env, organizationId }) {
  const row = await db
    .prepare(
      `SELECT id, api_version FROM shipstation_connection
       WHERE organization_id = ? AND deleted = 0
       LIMIT 1`,
    )
    .bind(organizationId)
    .first();
  if (!row) return null;

  const storedVersion = row.api_version === 'v1' ? 'v1' : 'v2';
  const resolved = await resolveShipStationCredentials({ env, db });
  if (!resolved) return null;

  if (resolved.apiVersion !== storedVersion) {
    return {
      connectionId: row.id,
      apiVersion: storedVersion,
      mismatch:
        `ShipStation secrets are ${resolved.apiVersion.toUpperCase()} but this connection was opened as ${storedVersion.toUpperCase()}. Disconnect and reconnect to switch API versions.`,
    };
  }
  return {
    connectionId: row.id,
    apiVersion: storedVersion,
    apiKey: resolved.apiKey,
    ...(resolved.apiSecret ? { apiSecret: resolved.apiSecret } : {}),
  };
}

export function publicConnection(row, extra = {}) {
  const credentialsMissing = Boolean(extra.credentialsMissing);
  return {
    id: row.id,
    organizationId: row.organization_id,
    // Row may still exist after secrets were removed — that is not "connected".
    connected: !credentialsMissing,
    staleConnection: credentialsMissing || Boolean(extra.staleConnection),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    apiVersion: row.api_version || extra.apiVersion || 'v2',
    ...(extra.carrierCount !== undefined ? { carrierCount: extra.carrierCount } : {}),
    ...(extra.mismatch ? { mismatch: extra.mismatch } : {}),
    ...(credentialsMissing ? { credentialsMissing: true } : {}),
  };
}

/** Credentials object for shipstation.js, or null when the connection cannot call ShipStation. */
function credentialsForApi(secret) {
  if (!secret || secret.mismatch || !secret.apiKey) return null;
  return {
    apiVersion: secret.apiVersion,
    apiKey: secret.apiKey,
    ...(secret.apiSecret ? { apiSecret: secret.apiSecret } : {}),
  };
}

function reconnectMessage(secret) {
  return secret?.mismatch || 'Connect a ShipStation account first.';
}

export function normalizeOrgSettings(row, organizationId) {
  return {
    organizationId,
    defaultFulfillmentMethod: row?.default_fulfillment_method ?? 'unspecified',
    syncMode: row?.sync_mode ?? 'digit_to_ss',
    pushWhen: row?.push_when ?? 'fully_packed',
    laneTagId: row?.lane_tag_id || null,
  };
}

export async function loadOrgSettings({ db, organizationId }) {
  const row = await db
    .prepare(
      `SELECT organization_id, default_fulfillment_method, sync_mode, push_when, lane_tag_id
       FROM org_settings WHERE organization_id = ?`,
    )
    .bind(organizationId)
    .first();
  return normalizeOrgSettings(row, organizationId);
}

export function publicMapRow(row) {
  if (!row) return null;
  return {
    digitOrderId: row.digit_order_id,
    digitShipmentId: row.digit_shipment_id,
    ssShipmentId: row.ss_shipment_id,
    ssLabelId: row.ss_label_id,
    source: row.source,
    pushStatus: row.push_status,
    lastError: row.last_error,
    trackingNumber: row.tracking_number,
    carrierName: row.carrier_name,
    shipDate: row.ship_date,
    shipmentCostAmount: row.shipment_cost_amount,
    shipmentCostCurrency: row.shipment_cost_currency,
  };
}

export async function mapsForShipments({ db, connectionId, shipmentIds }) {
  if (!shipmentIds.length) return [];
  const placeholders = shipmentIds.map(() => '?').join(',');
  const { results } = await db
    .prepare(
      `SELECT digit_order_id, digit_shipment_id, ss_shipment_id, ss_label_id, source,
              push_status, last_error, tracking_number, carrier_name, ship_date,
              shipment_cost_amount, shipment_cost_currency
       FROM shipstation_order_map
       WHERE connection_id = ? AND deleted = 0 AND digit_shipment_id IN (${placeholders})`,
    )
    .bind(connectionId, ...shipmentIds)
    .all();
  return (results ?? []).map(publicMapRow);
}

export async function mapsForOrders({ db, connectionId, orderIds }) {
  if (!orderIds.length) return [];
  const placeholders = orderIds.map(() => '?').join(',');
  const { results } = await db
    .prepare(
      `SELECT digit_order_id, digit_shipment_id, ss_shipment_id, ss_label_id, source,
              push_status, last_error, tracking_number, carrier_name, ship_date,
              shipment_cost_amount, shipment_cost_currency
       FROM shipstation_order_map
       WHERE connection_id = ? AND deleted = 0 AND digit_order_id IN (${placeholders})`,
    )
    .bind(connectionId, ...orderIds)
    .all();
  return (results ?? []).map(publicMapRow);
}

async function upsertMap({ db, connectionId, organizationId, digitOrderId, digitShipmentId, fields }) {
  let existing = null;
  if (digitShipmentId) {
    existing = await db
      .prepare(
        `SELECT id FROM shipstation_order_map
         WHERE connection_id = ? AND digit_shipment_id = ? AND deleted = 0
         LIMIT 1`,
      )
      .bind(connectionId, digitShipmentId)
      .first();
  }
  if (!existing && digitOrderId && !digitShipmentId) {
    existing = await db
      .prepare(
        `SELECT id FROM shipstation_order_map
         WHERE connection_id = ? AND digit_order_id = ? AND deleted = 0
         LIMIT 1`,
      )
      .bind(connectionId, digitOrderId)
      .first();
  }

  const shipmentId = digitShipmentId ?? fields.digitShipmentId ?? null;

  if (!existing) {
    await db
      .prepare(
        `INSERT INTO shipstation_order_map
           (connection_id, organization_id, digit_order_id, ss_shipment_id, ss_label_id,
            digit_shipment_id, source, push_status, last_error, tracking_number, carrier_name,
            ship_date, shipment_cost_amount, shipment_cost_currency)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        connectionId,
        organizationId,
        digitOrderId,
        fields.ssShipmentId ?? null,
        fields.ssLabelId ?? null,
        shipmentId,
        fields.source ?? 'digit',
        fields.pushStatus ?? 'pending',
        fields.lastError ?? null,
        fields.trackingNumber ?? null,
        fields.carrierName ?? null,
        fields.shipDate ?? null,
        fields.shipmentCostAmount ?? null,
        fields.shipmentCostCurrency ?? null,
      )
      .run();
    return;
  }

  await db
    .prepare(
      `UPDATE shipstation_order_map SET
         ss_shipment_id = COALESCE(?, ss_shipment_id),
         ss_label_id = COALESCE(?, ss_label_id),
         digit_shipment_id = COALESCE(?, digit_shipment_id),
         source = COALESCE(?, source),
         push_status = COALESCE(?, push_status),
         last_error = ?,
         tracking_number = COALESCE(?, tracking_number),
         carrier_name = COALESCE(?, carrier_name),
         ship_date = COALESCE(?, ship_date),
         shipment_cost_amount = COALESCE(?, shipment_cost_amount),
         shipment_cost_currency = COALESCE(?, shipment_cost_currency),
         updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(
      fields.ssShipmentId ?? null,
      fields.ssLabelId ?? null,
      shipmentId,
      fields.source ?? null,
      fields.pushStatus ?? null,
      fields.lastError === undefined ? null : fields.lastError,
      fields.trackingNumber ?? null,
      fields.carrierName ?? null,
      fields.shipDate ?? null,
      fields.shipmentCostAmount ?? null,
      fields.shipmentCostCurrency ?? null,
      existing.id,
    )
    .run();
}

async function mapBySsShipment({ db, connectionId, ssShipmentId }) {
  if (!ssShipmentId) return null;
  return db
    .prepare(
      `SELECT * FROM shipstation_order_map
       WHERE connection_id = ? AND ss_shipment_id = ? AND deleted = 0
       LIMIT 1`,
    )
    .bind(connectionId, ssShipmentId)
    .first();
}

function recordsFromSsPayload(data) {
  if (!data) return [];
  if (Array.isArray(data.orders)) return data.orders;
  if (Array.isArray(data.shipments)) return data.shipments;
  if (Array.isArray(data)) return data;
  if (data.shipment) return [data.shipment];
  if (data.order) return [data.order];
  return [data];
}

function firstCreatedShipment(data) {
  return recordsFromSsPayload(data)[0] ?? null;
}

function isInboundImportEvent(event) {
  const value = String(event || '').toLowerCase();
  return (
    value.includes('shipment_created') ||
    value.includes('sales_orders_imported') ||
    value.includes('order_notify') ||
    value.includes('ship_notify')
  );
}

export async function fetchDigitOrder({ env, orderId }) {
  const result = await digitGraphql({
    env,
    query: ORDER_BY_ID_QUERY,
    variables: { orderIds: [orderId] },
  });
  if (!result.ok) return result;
  const order = result.data?.orders?.nodes?.[0] ?? null;
  const organization = result.data?.organization ?? null;
  if (!order) {
    return {
      ok: false,
      code: AppErrorCode.VALIDATION_ERROR,
      message: 'Sales order not found.',
      status: 400,
    };
  }
  return { ok: true, data: { order, organization } };
}

export async function fetchDigitShipment({ env, shipmentId }) {
  const result = await digitGraphql({
    env,
    query: SHIPMENT_BY_ID_QUERY,
    variables: { shipmentId },
  });
  if (!result.ok) return result;
  const shipment = result.data?.shipment ?? null;
  const organization = result.data?.organization ?? null;
  if (!shipment) {
    return {
      ok: false,
      code: AppErrorCode.VALIDATION_ERROR,
      message: 'Digit shipment not found.',
      status: 400,
    };
  }
  return { ok: true, data: { shipment, organization } };
}

function pushMeaning({ skipped, reason, ssShipmentId, shipmentLabel }) {
  if (skipped) {
    return `${reason} ${skipNextStep(reason)}`.trim();
  }
  return `Created ShipStation shipment ${ssShipmentId} for ${shipmentLabel}. Print the label in ShipStation. This Digit shipment stays in the queue until it is marked shipped.`;
}

function shipmentLabel(shipment, shipmentId) {
  return (
    shipment?.documentNumber ||
    shipment?.shippingNumber ||
    shipment?.order?.documentNumber ||
    shipment?.order?.orderNumber ||
    shipmentId
  );
}

async function recordPushActivity({
  db,
  organizationId,
  actor,
  recordActivity,
  skipped,
  ok,
  orderId,
  ssShipmentId,
  message,
  detail,
}) {
  if (!recordActivity) return;
  if (actor === 'schedule' && skipped) return;
  await appendActivity({
    db,
    organizationId,
    actor,
    action: skipped ? 'push_skip' : ok ? 'push' : 'push_error',
    status: skipped ? 'skipped' : ok ? 'success' : 'error',
    message,
    digitOrderId: orderId,
    ssShipmentId: ssShipmentId ?? null,
    detail: detail ?? null,
  });
}

/**
 * `preloaded` lets the scheduled poll reuse the shipment it already listed. Without it every
 * candidate costs another Digit query, which is enough to hit the API rate limit.
 */
export async function pushShipment({
  env,
  db,
  organizationId,
  shipmentId,
  actor = 'user',
  recordActivity = true,
  preloaded = null,
}) {
  const secret = await liveCredentials({ db, env, organizationId });
  const credentials = credentialsForApi(secret);
  if (!credentials) {
    const message = reconnectMessage(secret);
    await recordPushActivity({
      db,
      organizationId,
      actor,
      recordActivity,
      skipped: false,
      ok: false,
      orderId: null,
      ssShipmentId: null,
      message,
    });
    return {
      ok: false,
      code: AppErrorCode.VALIDATION_ERROR,
      message,
      status: 400,
    };
  }
  const orgSettings = await loadOrgSettings({ db, organizationId });
  const existing = await db
    .prepare(
      `SELECT * FROM shipstation_order_map
       WHERE connection_id = ? AND digit_shipment_id = ? AND deleted = 0
       LIMIT 1`,
    )
    .bind(secret.connectionId, shipmentId)
    .first();

  const loaded =
    preloaded?.shipment
      ? { ok: true, data: { shipment: preloaded.shipment, organization: preloaded.organization ?? null } }
      : await fetchDigitShipment({ env, shipmentId });
  if (!loaded.ok) {
    await recordPushActivity({
      db,
      organizationId,
      actor,
      recordActivity,
      skipped: false,
      ok: false,
      orderId: null,
      ssShipmentId: null,
      message: loaded.message,
      detail: loaded.detail ?? { code: loaded.code },
    });
    return loaded;
  }
  const { shipment, organization } = loaded.data;
  const orderId = shipment?.order?.id ?? null;
  const label = shipmentLabel(shipment, shipmentId);

  const reason = ineligibilityReason({
    shipment,
    orgSettings,
    mapRow: existing ? publicMapRow(existing) : null,
  });
  if (reason) {
    if (orderId) {
      await upsertMap({
        db,
        connectionId: secret.connectionId,
        organizationId,
        digitOrderId: orderId,
        digitShipmentId: shipmentId,
        fields: { pushStatus: 'skipped', lastError: reason, source: existing?.source ?? 'digit' },
      });
    }
    const meaning = pushMeaning({ skipped: true, reason, shipmentLabel: label });
    await recordPushActivity({
      db,
      organizationId,
      actor,
      recordActivity,
      skipped: true,
      ok: true,
      orderId,
      ssShipmentId: existing?.ss_shipment_id ?? null,
      message: meaning,
    });
    return { ok: true, data: { shipmentId, orderId, skipped: true, reason, message: reason, meaning } };
  }

  const created =
    secret.apiVersion === 'v1'
      ? await createShipments({
          credentials,
          order: digitShipmentToV1Order({ shipment }),
        })
      : await createShipments({
          credentials,
          shipments: [
            digitShipmentToShipment({
              shipment,
              shipFrom: orgShipFrom({ organization }),
            }),
          ],
        });
  if (!created.ok) {
    await upsertMap({
      db,
      connectionId: secret.connectionId,
      organizationId,
      digitOrderId: orderId,
      digitShipmentId: shipmentId,
      fields: { pushStatus: 'error', lastError: created.message, source: 'digit' },
    });
    await recordPushActivity({
      db,
      organizationId,
      actor,
      recordActivity,
      skipped: false,
      ok: false,
      orderId,
      ssShipmentId: null,
      message: created.message,
      detail: created.detail ?? { code: created.code },
    });
    return created;
  }

  const ssShipment = firstCreatedShipment(created.data);
  const createdRecord = normalizeSsRecord(ssShipment?.order || ssShipment);
  const ssShipmentId =
    createdRecord.ssShipmentId || ssShipment?.shipment_id || ssShipment?.shipmentId || null;
  if (!ssShipmentId) {
    await upsertMap({
      db,
      connectionId: secret.connectionId,
      organizationId,
      digitOrderId: orderId,
      digitShipmentId: shipmentId,
      fields: {
        pushStatus: 'error',
        lastError: 'ShipStation did not return a shipment id.',
        source: 'digit',
      },
    });
    const message = 'ShipStation did not return a shipment id.';
    await recordPushActivity({
      db,
      organizationId,
      actor,
      recordActivity,
      skipped: false,
      ok: false,
      orderId,
      ssShipmentId: null,
      message,
    });
    return {
      ok: false,
      code: AppErrorCode.UPSTREAM_ERROR,
      message,
      status: 502,
    };
  }

  await upsertMap({
    db,
    connectionId: secret.connectionId,
    organizationId,
    digitOrderId: orderId,
    digitShipmentId: shipmentId,
    fields: {
      ssShipmentId,
      pushStatus: 'pushed',
      lastError: null,
      source: 'digit',
    },
  });
  const meaning = pushMeaning({ skipped: false, ssShipmentId, shipmentLabel: label });
  await recordPushActivity({
    db,
    organizationId,
    actor,
    recordActivity,
    skipped: false,
    ok: true,
    orderId,
    ssShipmentId,
    message: meaning,
  });
  return {
    ok: true,
    data: {
      shipmentId,
      orderId,
      ssShipmentId,
      skipped: false,
      message: `Created ShipStation shipment ${ssShipmentId}.`,
      meaning,
    },
  };
}

const POLL_PAGE_SIZE = 25;
const MAX_POLL_PAGES = 5;
/** Keeps one scheduled run inside the Digit API rate limit. Remaining shipments wait for the next run. */
const MAX_PUSHES_PER_RUN = 25;

export async function pollOutboundPush({ env, db }) {
  const { results } = await db
    .prepare(
      `SELECT organization_id FROM shipstation_connection WHERE deleted = 0`,
    )
    .all();

  const pushed = [];
  for (const row of results ?? []) {
    const organizationId = row.organization_id;
    const creds = await liveCredentials({ db, env, organizationId });
    if (!credentialsForApi(creds)) {
      if (creds?.mismatch) {
        await appendActivity({
          db,
          organizationId,
          actor: 'schedule',
          action: 'poll',
          status: 'error',
          message: creds.mismatch,
        });
      }
      continue;
    }
    const orgSettings = await loadOrgSettings({ db, organizationId });
    if (orgSettings.syncMode !== 'digit_to_ss') continue;

    let after = null;
    for (let page = 0; page < MAX_POLL_PAGES; page += 1) {
      const listed = await digitGraphql({
        env,
        query: SHIPMENT_LIST_QUERY,
        variables: {
          connection: { first: POLL_PAGE_SIZE, ...(after ? { after } : {}) },
        },
      });
      if (!listed.ok) break;
      const organization = listed.data?.organization ?? null;
      const nodes = listed.data?.shipments?.nodes ?? [];
      for (const shipment of nodes) {
        const result = await pushShipment({
          env,
          db,
          organizationId,
          shipmentId: shipment.id,
          actor: 'schedule',
          recordActivity: true,
          preloaded: { shipment, organization },
        });
        if (result.ok && result.data && !result.data.skipped) {
          pushed.push(result.data);
        }
      }
      if (pushed.length >= MAX_PUSHES_PER_RUN) break;
      if (!listed.data?.shipments?.pageInfo?.hasNextPage) break;
      after = listed.data.shipments.pageInfo.endCursor;
    }
  }
  return { pushed: pushed.length };
}

async function applyDigitShipmentWriteback({
  env,
  db,
  organizationId,
  connectionId,
  digitOrderId,
  mappedDigitShipmentId = null,
  trackingNumber,
  carrierName,
  shipDate,
  labelId,
  ssShipmentId,
  costAmount,
  costCurrency,
}) {
  const loaded = await fetchDigitOrder({ env, orderId: digitOrderId });
  if (!loaded.ok) return loaded;
  const { order } = loaded.data;

  let digitShipmentId =
    mappedDigitShipmentId ||
    order.shipments?.find((shipment) => shipment.shippingStatus !== 'cancelled')?.id ||
    null;

  if (!digitShipmentId) {
    const unpacked = (order.packContainers ?? []).filter((container) => !container.shipment);
    let packId = unpacked[0]?.id;
    if (!packId) {
      const createdPack = await digitGraphql({
        env,
        query: CREATE_PACK_CONTAINER_MUTATION,
        variables: {
          input: { orderIds: [digitOrderId], container: 'package' },
        },
      });
      if (!createdPack.ok) return createdPack;
      packId = createdPack.data?.createPackContainer?.packContainer?.id;
    }
    if (!packId) {
      return {
        ok: false,
        code: AppErrorCode.UPSTREAM_ERROR,
        message: 'Could not create a pack container for writeback.',
        status: 502,
      };
    }
    const createdShipment = await digitGraphql({
      env,
      query: CREATE_SHIPMENT_MUTATION,
      variables: {
        input: {
          packContainers: [packId],
          shipmentType: 'carrier',
          shippingStatus: 'shipped',
          trackingNumber: trackingNumber || undefined,
          notes: carrierName ? `Carrier: ${carrierName}` : undefined,
        },
      },
    });
    if (!createdShipment.ok) return createdShipment;
    digitShipmentId = createdShipment.data?.createShipment?.shipment?.id;
  } else {
    const updated = await digitGraphql({
      env,
      query: UPDATE_SHIPMENT_MUTATION,
      variables: {
        input: {
          shipmentId: digitShipmentId,
          shippingStatus: 'shipped',
          trackingNumber: trackingNumber || undefined,
          notes: carrierName ? `Carrier: ${carrierName}` : undefined,
          dropOffDate: shipDate || undefined,
        },
      },
    });
    if (!updated.ok) return updated;
  }

  await upsertMap({
    db,
    connectionId,
    organizationId,
    digitOrderId,
    digitShipmentId,
    fields: {
      digitShipmentId,
      ssShipmentId,
      ssLabelId: labelId,
      pushStatus: 'shipped',
      lastError: null,
      trackingNumber,
      carrierName,
      shipDate,
      shipmentCostAmount: costAmount,
      shipmentCostCurrency: costCurrency,
    },
  });

  const live = await db
    .prepare(
      `SELECT id FROM shipstation_carrier WHERE connection_id = ? AND deleted = 0 LIMIT 1`,
    )
    .bind(connectionId)
    .first();
  await db
    .prepare(
      `INSERT INTO shipment_label (connection_id, carrier_id) VALUES (?, ?)`,
    )
    .bind(connectionId, live?.id ?? null)
    .run();

  await afterDigitShipped({
    env,
    organizationId,
    order,
    shipment: {
      trackingNumber,
      carrierName,
      shipDate,
      digitShipmentId,
    },
  });

  return { ok: true, data: { digitOrderId, digitShipmentId, trackingNumber } };
}

export async function processSsFulfillment({
  env,
  db,
  organizationId,
  ssShipmentId,
  labelId,
  resourceUrl,
  record: preloaded = null,
}) {
  const secret = await liveCredentials({ db, env, organizationId });
  const credentials = credentialsForApi(secret);
  if (!credentials) {
    return {
      ok: true,
      data: { skipped: true, reason: reconnectMessage(secret) },
    };
  }

  let record = preloaded;
  if (!record && resourceUrl) {
    const fetched = await fetchResourceUrl({ credentials, resourceUrl });
    if (fetched.ok) record = firstCreatedShipment(fetched.data);
  }
  if (!record && labelId && credentials.apiVersion !== 'v1') {
    const fetched = await getLabel({ credentials, labelId });
    if (fetched.ok) record = fetched.data;
  }
  if (!record && ssShipmentId) {
    const fetched = await getShipment({ credentials, shipmentId: ssShipmentId });
    if (fetched.ok) record = firstCreatedShipment(fetched.data) || fetched.data;
  }

  const normalized = normalizeSsRecord(record);
  const shipmentId = ssShipmentId || normalized.ssShipmentId || null;
  const resolvedLabelId = labelId || normalized.labelId || null;
  const externalId = normalized.externalId || null;

  let map = shipmentId
    ? await mapBySsShipment({ db, connectionId: secret.connectionId, ssShipmentId: shipmentId })
    : null;
  if (!map && externalId) {
    map = await db
      .prepare(
        `SELECT * FROM shipstation_order_map
         WHERE connection_id = ? AND digit_shipment_id = ? AND deleted = 0
         LIMIT 1`,
      )
      .bind(secret.connectionId, externalId)
      .first();
  }
  if (!map && externalId) {
    map = await db
      .prepare(
        `SELECT * FROM shipstation_order_map
         WHERE connection_id = ? AND digit_order_id = ? AND deleted = 0
         LIMIT 1`,
      )
      .bind(secret.connectionId, externalId)
      .first();
  }
  if (!map && record) {
    const orgSettings = await loadOrgSettings({ db, organizationId });
    if (orgSettings.syncMode === 'ss_to_digit') {
      const imported = await importSsShipment({
        env,
        db,
        organizationId,
        connectionId: secret.connectionId,
        shipment: record,
      });
      if (!imported.ok) return imported;
      map = await mapBySsShipment({
        db,
        connectionId: secret.connectionId,
        ssShipmentId: shipmentId || imported.data?.ssShipmentId,
      });
    }
  }
  if (!map?.digit_order_id) {
    return { ok: true, data: { skipped: true, reason: 'No Digit order mapped for this shipment.' } };
  }

  return applyDigitShipmentWriteback({
    env,
    db,
    organizationId,
    connectionId: secret.connectionId,
    digitOrderId: map.digit_order_id,
    mappedDigitShipmentId: map.digit_shipment_id ?? null,
    trackingNumber: normalized.trackingNumber,
    carrierName: normalized.carrierCode,
    shipDate: normalized.shipDate,
    labelId: resolvedLabelId,
    ssShipmentId: shipmentId,
    costAmount: normalized.costAmount,
    costCurrency: normalized.costCurrency,
  });
}

async function findItemBySku({ env, sku }) {
  const result = await digitGraphql({
    env,
    query: ITEMS_BY_SEARCH_QUERY,
    variables: { search: sku, connection: { first: 10 } },
  });
  if (!result.ok) return result;
  const nodes = result.data?.items?.nodes ?? [];
  const match = nodes.find((item) => item.sku === sku) || nodes[0] || null;
  return { ok: true, data: match };
}

export async function importSsShipment({ env, db, organizationId, connectionId, shipment: rawShipment }) {
  const shipment = normalizedToImportShipment(normalizeSsRecord(rawShipment));
  const ssShipmentId = shipment.shipment_id;
  if (!ssShipmentId) {
    return {
      ok: false,
      code: AppErrorCode.VALIDATION_ERROR,
      message: 'ShipStation shipment is missing an id.',
      status: 400,
    };
  }
  const existing = await mapBySsShipment({ db, connectionId, ssShipmentId });
  if (existing) {
    return { ok: true, data: { digitOrderId: existing.digit_order_id, skipped: true } };
  }

  const companyName = ssCompanyName(shipment);
  const companies = await digitGraphql({
    env,
    query: COMPANIES_SEARCH_QUERY,
    variables: { search: companyName, connection: { first: 10 } },
  });
  if (!companies.ok) return companies;
  let companyId = (companies.data?.companies?.nodes ?? []).find(
    (company) => company.name === companyName,
  )?.id;
  if (!companyId) {
    const created = await digitGraphql({
      env,
      query: CREATE_COMPANY_MUTATION,
      variables: {
        input: {
          name: companyName,
          type: ['customer'],
          kind: 'company',
          billingAddress: ssBillingAddressInput(shipment),
          useBillingAsShipping: false,
        },
      },
    });
    if (!created.ok) return created;
    companyId = created.data?.createCompany?.company?.id;
  }
  if (!companyId) {
    return {
      ok: false,
      code: AppErrorCode.UPSTREAM_ERROR,
      message: 'Could not resolve a Digit customer for the inbound order.',
      status: 502,
    };
  }

  const location = await digitGraphql({
    env,
    query: CREATE_COMPANY_LOCATION_MUTATION,
    variables: { input: ssShipToLocationInput({ companyId, shipment }) },
  });
  if (!location.ok) return location;
  const shippingAddressId = location.data?.createCompanyLocation?.address?.id;
  if (!shippingAddressId) {
    return {
      ok: false,
      code: AppErrorCode.UPSTREAM_ERROR,
      message: 'Could not create a ship-to address.',
      status: 502,
    };
  }

  const org = await digitGraphql({
    env,
    query: `query ShipStationCurrency { organization { defaultCurrency { code } } }`,
  });
  const currencyCode = org.ok ? org.data?.organization?.defaultCurrency?.code || 'USD' : 'USD';

  const lines = [];
  for (const line of ssLineSkus(shipment)) {
    const item = await findItemBySku({ env, sku: line.sku });
    if (!item.ok) return item;
    if (!item.data) {
      return {
        ok: false,
        code: AppErrorCode.VALIDATION_ERROR,
        message: `No Digit item matches SKU ${line.sku}.`,
        status: 400,
      };
    }
    lines.push({
      id: item.data.id,
      quantity: line.quantity,
      cost: { currencyCode, costAmount: 0 },
    });
  }
  if (lines.length === 0) {
    return {
      ok: false,
      code: AppErrorCode.VALIDATION_ERROR,
      message: 'Inbound shipment has no SKUs that map to Digit items.',
      status: 400,
    };
  }

  const createdOrder = await digitGraphql({
    env,
    query: CREATE_ORDER_MUTATION,
    variables: {
      input: {
        customerId: companyId,
        shippingAddressId,
        customerReferenceNumber: shipment.shipment_number || ssShipmentId,
        orderStatus: 'unfulfilled',
        items: lines,
      },
    },
  });
  if (!createdOrder.ok) return createdOrder;
  const digitOrderId = createdOrder.data?.createOrder?.order?.id;
  if (!digitOrderId) {
    return {
      ok: false,
      code: AppErrorCode.UPSTREAM_ERROR,
      message: 'Digit did not return an order id.',
      status: 502,
    };
  }

  await upsertMap({
    db,
    connectionId,
    organizationId,
    digitOrderId,
    fields: {
      ssShipmentId,
      source: 'shipstation',
      pushStatus: 'imported',
      lastError: null,
    },
  });
  return { ok: true, data: { digitOrderId, ssShipmentId, skipped: false } };
}

export async function pollInbound({ env, db }) {
  const { results } = await db
    .prepare(
      `SELECT organization_id FROM shipstation_connection WHERE deleted = 0`,
    )
    .all();

  let imported = 0;
  for (const row of results ?? []) {
    const organizationId = row.organization_id;
    const orgSettings = await loadOrgSettings({ db, organizationId });
    if (orgSettings.syncMode !== 'ss_to_digit') continue;
    const secret = await liveCredentials({ db, env, organizationId });
    const credentials = credentialsForApi(secret);
    if (!credentials) {
      if (secret?.mismatch) {
        await appendActivity({
          db,
          organizationId,
          actor: 'schedule',
          action: 'poll',
          status: 'error',
          message: secret.mismatch,
        });
      }
      continue;
    }
    const listed = await listShipments({
      credentials,
      query: secret.apiVersion === 'v1' ? 'pageSize=25&page=1' : 'page=1&page_size=25',
    });
    if (!listed.ok) continue;
    const shipments = listed.data?.shipments ?? listed.data?.orders ?? listed.data ?? [];
    for (const shipment of Array.isArray(shipments) ? shipments : recordsFromSsPayload(shipments)) {
      const result = await importSsShipment({
        env,
        db,
        organizationId,
        connectionId: secret.connectionId,
        shipment,
      });
      if (result.ok && result.data && !result.data.skipped) {
        imported += 1;
        await appendActivity({
          db,
          organizationId,
          actor: 'schedule',
          action: 'poll',
          status: 'success',
          message: `Imported ShipStation shipment as Digit order ${result.data.digitOrderId}.`,
          digitOrderId: result.data.digitOrderId,
          ssShipmentId: result.data.ssShipmentId ?? null,
        });
      } else if (!result.ok) {
        await appendActivity({
          db,
          organizationId,
          actor: 'schedule',
          action: 'poll',
          status: 'error',
          message: result.message || 'Inbound poll import failed.',
          detail: { code: result.code ?? null },
        });
      }
    }
  }
  return { imported };
}

async function recordWebhookOutcome({ db, organizationId, event, ssShipmentId, result }) {
  const detail = { event: event || null };
  if (!result || result.skipped) {
    await appendActivity({
      db,
      organizationId,
      actor: 'webhook',
      action: 'webhook',
      status: 'skipped',
      message: 'ShipStation webhook had no organization or connection to apply.',
      ssShipmentId: ssShipmentId || null,
      detail,
    });
    return;
  }
  if (result.ok === false) {
    await appendActivity({
      db,
      organizationId,
      actor: 'webhook',
      action: 'writeback',
      status: 'error',
      message: result.message || 'Webhook writeback failed.',
      digitOrderId: result.data?.digitOrderId ?? null,
      ssShipmentId: ssShipmentId || null,
      detail: { ...detail, code: result.code ?? null },
    });
    return;
  }
  if (result.data?.skipped) {
    await appendActivity({
      db,
      organizationId,
      actor: 'webhook',
      action: 'webhook',
      status: 'skipped',
      message: result.data.reason || 'Webhook skipped; no Digit order was updated.',
      ssShipmentId: ssShipmentId || null,
      detail,
    });
    return;
  }
  await appendActivity({
    db,
    organizationId,
    actor: 'webhook',
    action: 'writeback',
    status: 'success',
    message:
      'ShipStation fulfillment event applied. Tracking was written to the Digit shipment (not stored in this log).',
    digitOrderId: result.data?.digitOrderId ?? null,
    ssShipmentId: ssShipmentId || result.data?.ssShipmentId || null,
    detail,
  });
}

export async function processWebhookJob({ env, payload }) {
  const db = requireEnv({ env, key: 'SHIPSTATION_DB' });
  const organizationId = payload?.organizationId;
  const resourceUrl = payload?.resourceUrl;
  const ssShipmentId = payload?.ssShipmentId != null ? String(payload.ssShipmentId) : null;
  const labelId = payload?.labelId;
  const event = payload?.event || '';

  if (!organizationId) {
    return { skipped: true };
  }

  const secret = await liveCredentials({ db, env, organizationId });
  const credentials = credentialsForApi(secret);
  if (!credentials) {
    const skipped = { skipped: true, reason: reconnectMessage(secret) };
    await recordWebhookOutcome({ db, organizationId, event, ssShipmentId, result: skipped });
    return skipped;
  }

  let records = payload?.shipment ? [payload.shipment] : [];
  if (records.length === 0 && resourceUrl) {
    const fetched = await fetchResourceUrl({ credentials, resourceUrl });
    if (fetched.ok) records = recordsFromSsPayload(fetched.data);
  }
  if (records.length === 0 && ssShipmentId) {
    const fetched = await getShipment({ credentials, shipmentId: ssShipmentId });
    if (fetched.ok) records = recordsFromSsPayload(fetched.data);
  }
  if (records.length > 25) records = records.slice(0, 25);

  if (isInboundImportEvent(event)) {
    const orgSettings = await loadOrgSettings({ db, organizationId });
    if (orgSettings.syncMode === 'ss_to_digit') {
      for (const shipment of records) {
        const imported = await importSsShipment({
          env,
          db,
          organizationId,
          connectionId: secret.connectionId,
          shipment,
        });
        if (imported.ok && imported.data && !imported.data.skipped) {
          await appendActivity({
            db,
            organizationId,
            actor: 'webhook',
            action: 'webhook',
            status: 'success',
            message: `Imported ShipStation shipment as Digit order ${imported.data.digitOrderId}.`,
            digitOrderId: imported.data.digitOrderId,
            ssShipmentId: imported.data.ssShipmentId ?? ssShipmentId ?? null,
            detail: { event },
          });
        } else if (!imported.ok) {
          await appendActivity({
            db,
            organizationId,
            actor: 'webhook',
            action: 'webhook',
            status: 'error',
            message: imported.message || 'Inbound import failed.',
            ssShipmentId: ssShipmentId || null,
            detail: { event, code: imported.code ?? null },
          });
        }
      }
    }
  }

  if (records.length === 0) {
    const result = await processSsFulfillment({
      env,
      db,
      organizationId,
      ssShipmentId,
      labelId,
      resourceUrl,
    });
    await recordWebhookOutcome({ db, organizationId, event, ssShipmentId, result });
    return result;
  }

  let lastResult = { ok: true, data: { skipped: true, reason: 'No Digit order mapped for this shipment.' } };
  for (const record of records) {
    const normalized = normalizeSsRecord(record);
    lastResult = await processSsFulfillment({
      env,
      db,
      organizationId,
      ssShipmentId: normalized.ssShipmentId || ssShipmentId,
      labelId: normalized.labelId || labelId,
      resourceUrl: null,
      record,
    });
    await recordWebhookOutcome({
      db,
      organizationId,
      event,
      ssShipmentId: normalized.ssShipmentId || ssShipmentId,
      result: lastResult,
    });
  }
  return lastResult;
}

export async function resolveShipmentByExternalId({ env, db, organizationId, externalShipmentId }) {
  const secret = await liveCredentials({ db, env, organizationId });
  const credentials = credentialsForApi(secret);
  if (!credentials) return null;
  return getShipmentByExternalId({ credentials, externalShipmentId });
}
