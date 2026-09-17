/**
 * ShipStation connection, org settings, and carrier catalog (D1).
 * Returns a Response when the request matches; otherwise null.
 *
 * Credentials are org-level Digit app secrets (never pasted into this app, never
 * selected into JSON). `api_key_encrypted` only holds legacy pasted keys (V2).
 */

import { AppErrorCode, parseJsonResponse, requiredString } from '@digit/lib-common';
import { err, ok, requireEnv } from '@digit/lib-backend';

import { FULFILLMENT_METHODS, normalizeFulfillmentMethod } from './eligibility.js';
import { appendActivity } from './activity.js';
import { loadShipStationApiKey, resolveShipStationCredentials } from './runtimeConfig.js';
import {
  listCarrierServices,
  listCarriers,
} from './shipstation.js';
import { liveCredentials, publicConnection, loadOrgSettings } from './sync.js';
import { loadCarrierMapPayload, saveManualCarrierMaps } from './matchDigitCarrier.js';

async function liveConnection({ db, organizationId }) {
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

function requireOrganizationId(url) {
  const organizationId = (url.searchParams.get('organizationId') || '').trim();
  if (!organizationId) {
    return {
      error: err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'organizationId is required.',
        status: 400,
      }),
    };
  }
  return { organizationId };
}

function normalizeCarrierList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.carriers)) return data.carriers;
  return [];
}

function normalizeServiceList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.services)) return data.services;
  return [];
}

async function syncCarriers({ db, connectionId, credentials, carriers }) {
  for (const carrier of carriers) {
    const shipstationCarrierId = String(
      carrier.carrier_id ??
        carrier.carrierId ??
        carrier.code ??
        carrier.id ??
        carrier.shippingProviderId ??
        '',
    );
    if (!shipstationCarrierId) continue;
    const name = String(
      carrier.friendly_name ?? carrier.name ?? carrier.nickname ?? shipstationCarrierId,
    );
    const carrierCode = carrier.carrier_code ?? carrier.carrierCode ?? carrier.code ?? null;

    const inserted = await db
      .prepare(
        `INSERT INTO shipstation_carrier
           (connection_id, shipstation_carrier_id, carrier_code, name, deleted)
         VALUES (?, ?, ?, ?, 0)
         RETURNING id`,
      )
      .bind(connectionId, shipstationCarrierId, carrierCode, name)
      .first();
    const carrierRowId = inserted.id;

    let services = normalizeServiceList(carrier.services);
    if (services.length === 0) {
      const listed = await listCarrierServices({
        credentials,
        carrierId: shipstationCarrierId,
        carrierCode: carrierCode || shipstationCarrierId,
      });
      if (listed.ok) services = normalizeServiceList(listed.data);
    }

    for (const service of services) {
      const code = String(
        service.service_code ?? service.serviceCode ?? service.code ?? '',
      );
      if (!code) continue;
      const serviceName = String(service.name ?? code);
      await db
        .prepare(
          `INSERT INTO shipstation_service
             (connection_id, carrier_id, shipstation_service_code, name, deleted)
           VALUES (?, ?, ?, ?, 0)`,
        )
        .bind(connectionId, carrierRowId, code, serviceName)
        .run();
    }
  }
}

async function carrierCount({ db, connectionId }) {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count FROM shipstation_carrier
       WHERE connection_id = ? AND deleted = 0`,
    )
    .bind(connectionId)
    .first();
  return Number(row?.count ?? 0);
}

async function loadCarriers({ db, connectionId }) {
  const { results: carrierRows } = await db
    .prepare(
      `SELECT id, shipstation_carrier_id, carrier_code, name
       FROM shipstation_carrier
       WHERE connection_id = ? AND deleted = 0
       ORDER BY name COLLATE NOCASE, id`,
    )
    .bind(connectionId)
    .all();

  const { results: serviceRows } = await db
    .prepare(
      `SELECT id, carrier_id, shipstation_service_code, name
       FROM shipstation_service
       WHERE connection_id = ? AND deleted = 0
       ORDER BY name COLLATE NOCASE, id`,
    )
    .bind(connectionId)
    .all();

  const servicesByCarrier = new Map();
  for (const service of serviceRows ?? []) {
    const list = servicesByCarrier.get(service.carrier_id) ?? [];
    list.push({
      id: service.id,
      carrierId: service.carrier_id,
      serviceCode: service.shipstation_service_code,
      name: service.name,
    });
    servicesByCarrier.set(service.carrier_id, list);
  }

  return (carrierRows ?? []).map((carrier) => ({
    id: carrier.id,
    shipstationCarrierId: carrier.shipstation_carrier_id,
    carrierCode: carrier.carrier_code,
    name: carrier.name,
    services: servicesByCarrier.get(carrier.id) ?? [],
  }));
}

async function retireConnectionLocal({ db, connectionId }) {
  await db
    .prepare(
      `UPDATE shipstation_webhook SET deleted = 1
       WHERE connection_id = ? AND deleted = 0`,
    )
    .bind(connectionId)
    .run();
  await db
    .prepare(
      `UPDATE shipstation_service SET deleted = 1, updated_at = datetime('now')
       WHERE connection_id = ? AND deleted = 0`,
    )
    .bind(connectionId)
    .run();
  await db
    .prepare(
      `UPDATE shipstation_carrier SET deleted = 1, updated_at = datetime('now')
       WHERE connection_id = ? AND deleted = 0`,
    )
    .bind(connectionId)
    .run();
  await db
    .prepare(
      `UPDATE shipstation_connection
       SET deleted = 1, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(connectionId)
    .run();
}

/**
 * Soft-delete a live connection.
 */
async function retireConnection({ db, connectionId }) {
  await retireConnectionLocal({ db, connectionId });
}

/**
 * @returns {Promise<Response | null>}
 */
export async function handleConnection({ request, env, path, method }) {
  const db = requireEnv({ env, key: 'SHIPSTATION_DB' });
  const url = new URL(request.url);

  if (method === 'GET' && path === '/connection') {
    const org = requireOrganizationId(url);
    if (org.error) return org.error;
    const row = await liveConnection({ db, organizationId: org.organizationId });
    if (!row) {
      return ok({ data: { connected: false, organizationId: org.organizationId } });
    }
    const count = await carrierCount({ db, connectionId: row.id });
    const resolved = await resolveShipStationCredentials({ env, db });
    const creds = resolved
      ? await liveCredentials({ db, env, organizationId: org.organizationId })
      : null;
    const credentialsMissing = !resolved;
    return ok({
      data: publicConnection(row, {
        carrierCount: count,
        apiVersion: row.api_version || 'v2',
        ...(creds?.mismatch ? { mismatch: creds.mismatch } : {}),
        ...(credentialsMissing ? { credentialsMissing: true, staleConnection: true } : {}),
      }),
    });
  }

  if (method === 'GET' && path === '/carriers') {
    const org = requireOrganizationId(url);
    if (org.error) return org.error;
    const row = await liveConnection({ db, organizationId: org.organizationId });
    if (!row) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'Connect a ShipStation account first.',
        status: 400,
      });
    }
    return ok({ data: { carriers: await loadCarriers({ db, connectionId: row.id }) } });
  }

  if (method === 'GET' && path === '/org-settings') {
    const org = requireOrganizationId(url);
    if (org.error) return org.error;
    const organizationId = org.organizationId;
    const settings = await loadOrgSettings({ db, organizationId });
    const row = await liveConnection({ db, organizationId });
    const carrierPayload = await loadCarrierMapPayload({
      env,
      db,
      organizationId,
      connectionId: row?.id ?? null,
    });
    return ok({ data: { ...settings, ...carrierPayload } });
  }

  if (method === 'POST' && path === '/connection') {
    const parsed = await parseJsonResponse({
      value: request.json(),
      fields: {
        organizationId: (obj) => requiredString({ obj, key: 'organizationId' }),
      },
    });
    if (!parsed.ok) {
      return err({ code: parsed.error.code, message: parsed.error.message, status: 400 });
    }
    const { organizationId } = parsed.value;

    const credentials = await resolveShipStationCredentials({ env, db });
    if (!credentials) {
      return err({
        code: AppErrorCode.MISSING_CONFIG,
        message:
          'No ShipStation API key is configured. Add SHIPSTATION_API_KEY to this app’s secrets in Digit (and SHIPSTATION_API_SECRET for V1), then try again.',
        status: 503,
      });
    }

    const existing = await liveConnection({ db, organizationId });
    if (existing) {
      // Stale row after secrets were removed/restored, or UI showed Connect while still linked.
      // Retire the old connection so Connect can succeed without a separate Disconnect click.
      await retireConnection({
        db,
        connectionId: existing.id,
      });
      await appendActivity({
        db,
        organizationId,
        actor: 'user',
        action: 'disconnect',
        status: 'success',
        message:
          'Replaced the previous ShipStation connection before reconnecting with current secrets.',
        detail: { previousConnectionId: existing.id },
      });
    }

    const listed = await listCarriers({ credentials });
    if (!listed.ok) {
      return err({
        code: listed.code,
        message: listed.message,
        status: listed.status,
      });
    }

    let inserted;
    try {
      inserted = await db
        .prepare(
          `INSERT INTO shipstation_connection (organization_id, api_key_encrypted, api_version, deleted)
           VALUES (?, '', ?, 0)
           RETURNING id, organization_id, api_version, created_at, updated_at`,
        )
        .bind(organizationId, credentials.apiVersion)
        .first();
    } catch {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message:
          'This organization already has a ShipStation account connected. Disconnect it first to reconnect.',
        status: 409,
      });
    }

    await syncCarriers({
      db,
      connectionId: inserted.id,
      credentials,
      carriers: normalizeCarrierList(listed.data),
    });

    const count = await carrierCount({ db, connectionId: inserted.id });
    const versionLabel = credentials.apiVersion === 'v1' ? 'V1' : 'V2';
    await appendActivity({
      db,
      organizationId,
      actor: 'user',
      action: 'connect',
      status: 'success',
      message: `Connected ShipStation ${versionLabel} and synced ${count} carrier(s). Push from the queue, then buy labels in ShipStation.`,
      detail: { carrierCount: count, apiVersion: credentials.apiVersion },
    });
    return ok({
      data: publicConnection(inserted, {
        carrierCount: count,
        apiVersion: inserted.api_version || credentials.apiVersion,
      }),
      status: 201,
    });
  }

  if (method === 'PATCH' && path === '/org-settings') {
    const parsed = await parseJsonResponse({ value: request.json() });
    if (!parsed.ok) {
      return err({ code: parsed.error.code, message: parsed.error.message, status: 400 });
    }
    const body = parsed.value;
    const organizationIdResult = requiredString({ obj: body, key: 'organizationId' });
    if (!organizationIdResult.ok) {
      return err({
        code: organizationIdResult.error.code,
        message: organizationIdResult.error.message,
        status: 400,
      });
    }
    const organizationId = organizationIdResult.value;
    const current = await loadOrgSettings({ db, organizationId });

    let defaultFulfillmentMethod = current.defaultFulfillmentMethod;
    if (body.defaultFulfillmentMethod !== undefined && body.defaultFulfillmentMethod !== null) {
      defaultFulfillmentMethod = normalizeFulfillmentMethod(String(body.defaultFulfillmentMethod));
    }

    let defaultWeightOz = current.defaultWeightOz;
    if (body.defaultWeightOz !== undefined) {
      const n = Number(body.defaultWeightOz);
      if (!Number.isFinite(n) || n <= 0) {
        return err({
          code: AppErrorCode.VALIDATION_ERROR,
          message: 'defaultWeightOz must be a number greater than 0.',
          status: 400,
        });
      }
      defaultWeightOz = n;
    }

    if (!FULFILLMENT_METHODS.has(defaultFulfillmentMethod)) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'defaultFulfillmentMethod must be scheduled or manual.',
        status: 400,
      });
    }
    await db
      .prepare(
        `INSERT INTO org_settings (
           organization_id, default_fulfillment_method, sync_mode, push_when, lane_tag_id,
           default_weight_oz, default_length_in, default_width_in, default_height_in, rate_strategy
         )
         VALUES (?, ?, 'digit_to_ss', 'fully_packed', NULL, ?, NULL, NULL, NULL, 'cheapest')
         ON CONFLICT(organization_id) DO UPDATE SET
           default_fulfillment_method = excluded.default_fulfillment_method,
           default_weight_oz = excluded.default_weight_oz,
           updated_at = datetime('now')`,
      )
      .bind(organizationId, defaultFulfillmentMethod, defaultWeightOz)
      .run();

    if (Array.isArray(body.mappings)) {
      const connectionRow = await liveConnection({ db, organizationId });
      if (connectionRow) {
        await saveManualCarrierMaps({
          db,
          connectionId: connectionRow.id,
          mappings: body.mappings,
        });
      }
    }

    await appendActivity({
      db,
      organizationId,
      actor: 'user',
      action: 'settings',
      status: 'success',
      message: `Saved settings (push ${defaultFulfillmentMethod}, default weight ${defaultWeightOz} oz).`,
    });
    const carrierPayload = await loadCarrierMapPayload({
      env,
      db,
      organizationId,
      connectionId: (await liveConnection({ db, organizationId }))?.id ?? null,
    });
    return ok({
      data: { ...(await loadOrgSettings({ db, organizationId })), ...carrierPayload },
    });
  }

  if (method === 'DELETE' && path === '/connection') {
    const parsed = await parseJsonResponse({
      value: request.json(),
      fields: {
        organizationId: (obj) => requiredString({ obj, key: 'organizationId' }),
      },
    });
    if (!parsed.ok) {
      return err({ code: parsed.error.code, message: parsed.error.message, status: 400 });
    }
    const { organizationId } = parsed.value;
    const row = await liveConnection({ db, organizationId });
    if (!row) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'No ShipStation account is connected.',
        status: 400,
      });
    }

    await retireConnection({ db, connectionId: row.id });

    await appendActivity({
      db,
      organizationId,
      actor: 'user',
      action: 'disconnect',
      status: 'success',
      message:
        'Disconnected ShipStation. Order maps and activity history remain. Reconnect to push again.',
    });

    return ok({ data: { connected: false, organizationId } });
  }

  return null;
}

// Re-export for tests / callers that imported liveConnection from here historically.
export { liveCredentials, loadShipStationApiKey };
