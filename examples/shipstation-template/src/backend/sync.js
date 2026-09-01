/**
 * Idempotent Digit ↔ ShipStation order sync.
 */

import { AppErrorCode } from '@digit/lib-common';
import { HandlerError, requireEnv } from '@digit/lib-backend';

import { afterDigitShipped } from './channels/index.js';
import { decryptSecret } from './crypto.js';
import { digitGraphql } from './digitGraphql.js';
import {
  COMPANIES_SEARCH_QUERY,
  CREATE_COMPANY_LOCATION_MUTATION,
  CREATE_COMPANY_MUTATION,
  CREATE_ORDER_MUTATION,
  CREATE_PACK_CONTAINER_MUTATION,
  CREATE_SHIPMENT_MUTATION,
  ITEMS_BY_SEARCH_QUERY,
  ORDER_BY_ID_QUERY,
  ORDER_DETAIL_QUERY,
  UPDATE_SHIPMENT_MUTATION,
} from './digitQueries.js';
import { ineligibilityReason } from './eligibility.js';
import { digitOrderToShipment, orgShipFrom } from './mappers/digitToShipStation.js';
import {
  ssBillingAddressInput,
  ssCompanyName,
  ssLineSkus,
  ssShipToLocationInput,
} from './mappers/shipStationToDigit.js';
import { loadEncryptionKeyBytes } from './runtimeConfig.js';
import {
  createShipments,
  fetchResourceUrl,
  getLabel,
  getShipment,
  getShipmentByExternalId,
  listShipments,
} from './shipstation.js';

async function encryptionKeyBytes({ env, db }) {
  const keyBytes = await loadEncryptionKeyBytes({ env, db });
  if (!keyBytes) {
    throw new HandlerError({
      code: AppErrorCode.MISSING_CONFIG,
      message: 'Save configuration on the setup screen before connecting ShipStation.',
      status: 503,
    });
  }
  return keyBytes;
}

export async function liveConnection({ db, organizationId }) {
  return db
    .prepare(
      `SELECT id, organization_id, created_at, updated_at
       FROM shipstation_connection
       WHERE organization_id = ? AND deleted = 0
       LIMIT 1`,
    )
    .bind(organizationId)
    .first();
}

export async function liveApiKey({ db, env, organizationId }) {
  const row = await db
    .prepare(
      `SELECT id, api_key_encrypted FROM shipstation_connection
       WHERE organization_id = ? AND deleted = 0
       LIMIT 1`,
    )
    .bind(organizationId)
    .first();
  if (!row) return null;
  const apiKey = await decryptSecret({
    stored: row.api_key_encrypted,
    keyBytes: await encryptionKeyBytes({ env, db }),
  });
  return { connectionId: row.id, apiKey };
}

export function publicConnection(row, extra = {}) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    connected: true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(extra.carrierCount !== undefined ? { carrierCount: extra.carrierCount } : {}),
  };
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

async function upsertMap({ db, connectionId, organizationId, digitOrderId, fields }) {
  const existing = await db
    .prepare(
      `SELECT id FROM shipstation_order_map
       WHERE connection_id = ? AND digit_order_id = ? AND deleted = 0
       LIMIT 1`,
    )
    .bind(connectionId, digitOrderId)
    .first();

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
        fields.digitShipmentId ?? null,
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
      fields.digitShipmentId ?? null,
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

function firstCreatedShipment(data) {
  const list = Array.isArray(data?.shipments) ? data.shipments : Array.isArray(data) ? data : [];
  return list[0] ?? data?.shipment ?? null;
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

export async function pushOrder({ env, db, organizationId, orderId }) {
  const secret = await liveApiKey({ db, env, organizationId });
  if (!secret) {
    return {
      ok: false,
      code: AppErrorCode.VALIDATION_ERROR,
      message: 'Connect a ShipStation account first.',
      status: 400,
    };
  }
  const orgSettings = await loadOrgSettings({ db, organizationId });
  const existing = await db
    .prepare(
      `SELECT * FROM shipstation_order_map
       WHERE connection_id = ? AND digit_order_id = ? AND deleted = 0
       LIMIT 1`,
    )
    .bind(secret.connectionId, orderId)
    .first();

  const loaded = await fetchDigitOrder({ env, orderId });
  if (!loaded.ok) return loaded;
  const { order, organization } = loaded.data;

  const reason = ineligibilityReason({
    order,
    orgSettings,
    mapRow: existing ? publicMapRow(existing) : null,
  });
  if (reason) {
    await upsertMap({
      db,
      connectionId: secret.connectionId,
      organizationId,
      digitOrderId: orderId,
      fields: { pushStatus: 'skipped', lastError: reason, source: existing?.source ?? 'digit' },
    });
    return { ok: true, data: { orderId, skipped: true, reason } };
  }

  const shipmentBody = digitOrderToShipment({
    order,
    shipFrom: orgShipFrom({ organization }),
  });
  const created = await createShipments({
    apiKey: secret.apiKey,
    shipments: [shipmentBody],
  });
  if (!created.ok) {
    await upsertMap({
      db,
      connectionId: secret.connectionId,
      organizationId,
      digitOrderId: orderId,
      fields: { pushStatus: 'error', lastError: created.message, source: 'digit' },
    });
    return created;
  }

  const ssShipment = firstCreatedShipment(created.data);
  const ssShipmentId = ssShipment?.shipment_id || ssShipment?.shipmentId || null;
  if (!ssShipmentId) {
    await upsertMap({
      db,
      connectionId: secret.connectionId,
      organizationId,
      digitOrderId: orderId,
      fields: {
        pushStatus: 'error',
        lastError: 'ShipStation did not return a shipment id.',
        source: 'digit',
      },
    });
    return {
      ok: false,
      code: AppErrorCode.UPSTREAM_ERROR,
      message: 'ShipStation did not return a shipment id.',
      status: 502,
    };
  }

  await upsertMap({
    db,
    connectionId: secret.connectionId,
    organizationId,
    digitOrderId: orderId,
    fields: {
      ssShipmentId,
      pushStatus: 'pushed',
      lastError: null,
      source: 'digit',
    },
  });
  return { ok: true, data: { orderId, ssShipmentId, skipped: false } };
}

export async function pollOutboundPush({ env, db }) {
  const { results } = await db
    .prepare(
      `SELECT organization_id FROM shipstation_connection WHERE deleted = 0`,
    )
    .all();

  const pushed = [];
  for (const row of results ?? []) {
    const organizationId = row.organization_id;
    const orgSettings = await loadOrgSettings({ db, organizationId });
    if (orgSettings.syncMode !== 'digit_to_ss') continue;

    let after = null;
    for (let page = 0; page < 5; page += 1) {
      const listed = await digitGraphql({
        env,
        query: ORDER_DETAIL_QUERY,
        variables: {
          connection: { first: 25, ...(after ? { after } : {}) },
        },
      });
      if (!listed.ok) break;
      const nodes = listed.data?.orders?.nodes ?? [];
      for (const order of nodes) {
        const result = await pushOrder({ env, db, organizationId, orderId: order.id });
        if (result.ok && result.data && !result.data.skipped) {
          pushed.push(result.data);
        }
      }
      if (!listed.data?.orders?.pageInfo?.hasNextPage) break;
      after = listed.data.orders.pageInfo.endCursor;
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
    order.shipments?.find((shipment) => shipment.shippingStatus !== 'cancelled')?.id ?? null;

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

function trackingFromSs(record) {
  return (
    record?.tracking_number ||
    record?.trackingNumber ||
    record?.packages?.[0]?.tracking_number ||
    null
  );
}

export async function processSsFulfillment({
  env,
  db,
  organizationId,
  ssShipmentId,
  labelId,
  resourceUrl,
}) {
  const secret = await liveApiKey({ db, env, organizationId });
  if (!secret) return { ok: true, data: { skipped: true } };

  let record = null;
  if (resourceUrl) {
    const fetched = await fetchResourceUrl({ apiKey: secret.apiKey, resourceUrl });
    if (fetched.ok) record = fetched.data;
  }
  if (!record && labelId) {
    const fetched = await getLabel({ apiKey: secret.apiKey, labelId });
    if (fetched.ok) record = fetched.data;
  }
  if (!record && ssShipmentId) {
    const fetched = await getShipment({ apiKey: secret.apiKey, shipmentId: ssShipmentId });
    if (fetched.ok) record = fetched.data;
  }

  const shipmentId =
    ssShipmentId ||
    record?.shipment_id ||
    record?.shipmentId ||
    null;
  const resolvedLabelId = labelId || record?.label_id || record?.labelId || null;
  const externalId =
    record?.external_shipment_id ||
    record?.externalShipmentId ||
    null;

  let map = shipmentId
    ? await mapBySsShipment({ db, connectionId: secret.connectionId, ssShipmentId: shipmentId })
    : null;
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
  if (!map) {
    const orgSettings = await loadOrgSettings({ db, organizationId });
    if (orgSettings.syncMode === 'ss_to_digit' && record) {
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
        ssShipmentId: shipmentId,
      });
    }
  }
  if (!map?.digit_order_id) {
    return { ok: true, data: { skipped: true, reason: 'No Digit order mapped for this shipment.' } };
  }

  const cost = record?.shipment_cost || record?.shipmentCost;
  return applyDigitShipmentWriteback({
    env,
    db,
    organizationId,
    connectionId: secret.connectionId,
    digitOrderId: map.digit_order_id,
    trackingNumber: trackingFromSs(record),
    carrierName: record?.carrier_code || record?.carrierCode || record?.service_code || null,
    shipDate: record?.ship_date || record?.shipDate || record?.created_at || null,
    labelId: resolvedLabelId,
    ssShipmentId: shipmentId,
    costAmount: cost?.amount ?? null,
    costCurrency: cost?.currency ?? null,
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

export async function importSsShipment({ env, db, organizationId, connectionId, shipment }) {
  const ssShipmentId = shipment?.shipment_id || shipment?.shipmentId;
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
    const secret = await liveApiKey({ db, env, organizationId });
    if (!secret) continue;
    const listed = await listShipments({
      apiKey: secret.apiKey,
      query: 'page=1&page_size=25',
    });
    if (!listed.ok) continue;
    const shipments = listed.data?.shipments ?? listed.data ?? [];
    for (const shipment of Array.isArray(shipments) ? shipments : []) {
      const result = await importSsShipment({
        env,
        db,
        organizationId,
        connectionId: secret.connectionId,
        shipment,
      });
      if (result.ok && result.data && !result.data.skipped) imported += 1;
    }
  }
  return { imported };
}

export async function processWebhookJob({ env, payload }) {
  const db = requireEnv({ env, key: 'SHIPSTATION_DB' });
  const organizationId = payload?.organizationId;
  if (!organizationId) return { skipped: true };

  const resourceUrl = payload?.resourceUrl;
  const ssShipmentId = payload?.ssShipmentId;
  const labelId = payload?.labelId;
  const event = payload?.event || '';

  if (event.includes('shipment_created') || event.includes('sales_orders_imported')) {
    const secret = await liveApiKey({ db, env, organizationId });
    if (!secret) return { skipped: true };
    let shipment = payload?.shipment || null;
    if (!shipment && ssShipmentId) {
      const fetched = await getShipment({ apiKey: secret.apiKey, shipmentId: ssShipmentId });
      if (fetched.ok) shipment = fetched.data;
    }
    if (!shipment && resourceUrl) {
      const fetched = await fetchResourceUrl({ apiKey: secret.apiKey, resourceUrl });
      if (fetched.ok) shipment = firstCreatedShipment(fetched.data) || fetched.data;
    }
    const orgSettings = await loadOrgSettings({ db, organizationId });
    if (orgSettings.syncMode === 'ss_to_digit' && shipment) {
      await importSsShipment({
        env,
        db,
        organizationId,
        connectionId: secret.connectionId,
        shipment,
      });
    }
  }

  return processSsFulfillment({
    env,
    db,
    organizationId,
    ssShipmentId,
    labelId,
    resourceUrl,
  });
}

export async function resolveShipmentByExternalId({ env, db, organizationId, externalShipmentId }) {
  const secret = await liveApiKey({ db, env, organizationId });
  if (!secret) return null;
  return getShipmentByExternalId({ apiKey: secret.apiKey, externalShipmentId });
}
