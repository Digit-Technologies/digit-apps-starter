/**
 * ShipStation connection, org settings, and carrier catalog (D1).
 * Returns a Response when the request matches; otherwise null.
 *
 * api_key_encrypted is never selected into JSON responses.
 */

import { AppErrorCode, parseJsonResponse, requiredString } from '@digit/lib-common';
import { err, ok, requireEnv } from '@digit/lib-backend';

import { decryptSecret, encryptSecret } from './crypto.js';
import { FULFILLMENT_METHODS, PUSH_WHENS, SYNC_MODES } from './eligibility.js';
import {
  ensureEncryptionKeyBytes,
  loadPublicWebhookUrl,
} from './runtimeConfig.js';
import {
  createWebhook,
  deleteWebhook,
  listCarrierServices,
  listCarriers,
} from './shipstation.js';
import { loadOrgSettings, publicConnection } from './sync.js';

const WEBHOOK_EVENTS = [
  'label_created_v2',
  'track',
  'fulfillment_shipped_v2',
  'shipment_created_v2',
  'sales_orders_imported',
];

async function encryptionKeyBytes({ env, db }) {
  return ensureEncryptionKeyBytes({ env, db });
}

async function liveConnection({ db, organizationId }) {
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

async function liveConnectionWithSecret({ db, organizationId }) {
  return db
    .prepare(
      `SELECT id, api_key_encrypted FROM shipstation_connection
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

async function syncCarriers({ db, connectionId, apiKey, carriers }) {
  for (const carrier of carriers) {
    const shipstationCarrierId = String(
      carrier.carrier_id ?? carrier.carrierId ?? carrier.id ?? '',
    );
    if (!shipstationCarrierId) continue;
    const name = String(carrier.friendly_name ?? carrier.name ?? shipstationCarrierId);
    const carrierCode = carrier.carrier_code ?? carrier.carrierCode ?? null;

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
      const listed = await listCarrierServices({ apiKey, carrierId: shipstationCarrierId });
      if (listed.ok) services = normalizeServiceList(listed.data);
    }

    for (const service of services) {
      const code = String(service.service_code ?? service.serviceCode ?? service.code ?? '');
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

async function registerWebhooks({ db, env, connectionId, apiKey }) {
  const url = await loadPublicWebhookUrl({ env, db });
  if (!url) return;

  for (const event of WEBHOOK_EVENTS) {
    const created = await createWebhook({
      apiKey,
      name: `Digit ${event}`,
      event,
      url,
    });
    if (!created.ok || !created.data) continue;
    const webhookId = created.data.webhook_id ?? created.data.webhookId;
    if (!webhookId) continue;
    await db
      .prepare(
        `INSERT INTO shipstation_webhook
           (connection_id, shipstation_webhook_id, event, deleted)
         VALUES (?, ?, ?, 0)`,
      )
      .bind(connectionId, String(webhookId), event)
      .run();
  }
}

async function deregisterWebhooks({ db, connectionId, apiKey }) {
  const { results } = await db
    .prepare(
      `SELECT id, shipstation_webhook_id FROM shipstation_webhook
       WHERE connection_id = ? AND deleted = 0`,
    )
    .bind(connectionId)
    .all();

  for (const row of results ?? []) {
    await deleteWebhook({ apiKey, webhookId: row.shipstation_webhook_id });
    await db
      .prepare(
        `UPDATE shipstation_webhook SET deleted = 1 WHERE id = ?`,
      )
      .bind(row.id)
      .run();
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
    return ok({ data: publicConnection(row, { carrierCount: count }) });
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
    return ok({ data: await loadOrgSettings({ db, organizationId: org.organizationId }) });
  }

  if (method === 'POST' && path === '/connection') {
    const parsed = await parseJsonResponse({
      value: request.json(),
      fields: {
        organizationId: (obj) => requiredString({ obj, key: 'organizationId' }),
        apiKey: (obj) => requiredString({ obj, key: 'apiKey', trim: true }),
      },
    });
    if (!parsed.ok) {
      return err({ code: parsed.error.code, message: parsed.error.message, status: 400 });
    }
    const { organizationId, apiKey } = parsed.value;

    const existing = await liveConnection({ db, organizationId });
    if (existing) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'This organization already has a ShipStation account connected. Disconnect it first to reconnect.',
        status: 409,
      });
    }

    const listed = await listCarriers({ apiKey });
    if (!listed.ok) {
      return err({
        code: listed.code,
        message: listed.message,
        status: listed.status,
      });
    }

    const keyBytes = await encryptionKeyBytes({ env, db });
    const apiKeyEncrypted = await encryptSecret({ plaintext: apiKey, keyBytes });

    let inserted;
    try {
      inserted = await db
        .prepare(
          `INSERT INTO shipstation_connection (organization_id, api_key_encrypted, deleted)
           VALUES (?, ?, 0)
           RETURNING id, organization_id, created_at, updated_at`,
        )
        .bind(organizationId, apiKeyEncrypted)
        .first();
    } catch {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'This organization already has a ShipStation account connected. Disconnect it first to reconnect.',
        status: 409,
      });
    }

    await syncCarriers({
      db,
      connectionId: inserted.id,
      apiKey,
      carriers: normalizeCarrierList(listed.data),
    });
    await registerWebhooks({ db, env, connectionId: inserted.id, apiKey });

    const count = await carrierCount({ db, connectionId: inserted.id });
    return ok({ data: publicConnection(inserted, { carrierCount: count }), status: 201 });
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
      defaultFulfillmentMethod = String(body.defaultFulfillmentMethod);
    }
    const syncMode = body.syncMode === undefined ? current.syncMode : body.syncMode;
    const pushWhen = body.pushWhen === undefined ? current.pushWhen : body.pushWhen;
    const laneTagId =
      body.laneTagId === undefined
        ? current.laneTagId
        : body.laneTagId === null || body.laneTagId === ''
          ? null
          : String(body.laneTagId).trim();

    if (!FULFILLMENT_METHODS.has(defaultFulfillmentMethod)) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'defaultFulfillmentMethod must be unspecified, shipstation, or manual.',
        status: 400,
      });
    }
    if (!SYNC_MODES.has(syncMode)) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'syncMode must be digit_to_ss or ss_to_digit.',
        status: 400,
      });
    }
    if (!PUSH_WHENS.has(pushWhen)) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'pushWhen must be fully_packed or inventory_available.',
        status: 400,
      });
    }

    await db
      .prepare(
        `INSERT INTO org_settings (organization_id, default_fulfillment_method, sync_mode, push_when, lane_tag_id)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(organization_id) DO UPDATE SET
           default_fulfillment_method = excluded.default_fulfillment_method,
           sync_mode = excluded.sync_mode,
           push_when = excluded.push_when,
           lane_tag_id = excluded.lane_tag_id,
           updated_at = datetime('now')`,
      )
      .bind(organizationId, defaultFulfillmentMethod, syncMode, pushWhen, laneTagId)
      .run();
    return ok({
      data: await loadOrgSettings({ db, organizationId }),
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
    const row = await liveConnectionWithSecret({ db, organizationId });
    if (!row) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'No ShipStation account is connected.',
        status: 400,
      });
    }

    let apiKey = null;
    try {
      apiKey = await decryptSecret({
        stored: row.api_key_encrypted,
        keyBytes: await encryptionKeyBytes({ env, db }),
      });
    } catch {
      apiKey = null;
    }

    if (apiKey) {
      await deregisterWebhooks({ db, connectionId: row.id, apiKey });
    } else {
      await db
        .prepare(
          `UPDATE shipstation_webhook SET deleted = 1
           WHERE connection_id = ? AND deleted = 0`,
        )
        .bind(row.id)
        .run();
    }

    await db
      .prepare(
        `UPDATE shipstation_service SET deleted = 1, updated_at = datetime('now')
         WHERE connection_id = ? AND deleted = 0`,
      )
      .bind(row.id)
      .run();
    await db
      .prepare(
        `UPDATE shipstation_carrier SET deleted = 1, updated_at = datetime('now')
         WHERE connection_id = ? AND deleted = 0`,
      )
      .bind(row.id)
      .run();
    await db
      .prepare(
        `UPDATE shipstation_connection
         SET deleted = 1, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(row.id)
      .run();

    return ok({ data: { connected: false, organizationId } });
  }

  return null;
}
