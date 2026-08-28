/**
 * ShipStation connection, org settings, and carrier catalog (D1).
 * Returns a Response when the request matches; otherwise null.
 *
 * api_key_encrypted is never selected into JSON responses.
 */

import {
  AppErrorCode,
  optionalString,
  parseJsonResponse,
  requiredString,
} from '@digit/lib-common';
import { err, ok, optionalEnv, requireEnv } from '@digit/lib-backend';

import { decryptSecret, encryptSecret, parseEncryptionKey } from './crypto.js';
import {
  createWebhook,
  deleteWebhook,
  listCarrierServices,
  listCarriers,
} from './shipstation.js';

const RATE_TIMINGS = new Set(['order_creation', 'shipping']);
const RATE_MODES = new Set(['rate_shop', 'best_rate', 'strict_default']);
const BEST_RATE_STRATEGIES = new Set(['cheapest', 'fastest']);
const FULFILLMENT_METHODS = new Set(['unspecified', 'shipstation', 'manual']);
const WEBHOOK_EVENTS = ['label_created_v2', 'track'];

const DEFAULT_DEFAULTS = {
  defaultCarrierId: null,
  defaultServiceId: null,
  fallbackWeight: { value: 1, unit: 'ounce' },
  fallbackLength: { value: 6, unit: 'inch' },
  fallbackWidth: { value: 4, unit: 'inch' },
  fallbackHeight: { value: 2, unit: 'inch' },
};

function encryptionKeyBytes({ env }) {
  const raw = requireEnv({ env, key: 'APP_SECRET_ENCRYPTION_KEY' });
  return parseEncryptionKey({ raw });
}

function parseDefaults(raw) {
  if (raw == null || raw === '') return { ...DEFAULT_DEFAULTS };
  if (typeof raw === 'object') return { ...DEFAULT_DEFAULTS, ...raw };
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_DEFAULTS, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
  } catch {
    return { ...DEFAULT_DEFAULTS };
  }
}

function publicConnection(row, extra = {}) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    connected: true,
    rateTiming: row.rate_timing,
    rateMode: row.rate_mode,
    bestRateStrategy: row.best_rate_strategy,
    addCostToShippingFees: Boolean(row.add_cost_to_shipping_fees),
    autoSendReturnEmail: Boolean(row.auto_send_return_email),
    blockOnInvalidAddress: Boolean(row.block_on_invalid_address),
    defaults: parseDefaults(row.defaults),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(extra.carrierCount !== undefined ? { carrierCount: extra.carrierCount } : {}),
  };
}

async function liveConnection({ db, organizationId }) {
  return db
    .prepare(
      `SELECT id, organization_id, rate_timing, rate_mode, best_rate_strategy,
              add_cost_to_shipping_fees, auto_send_return_email, block_on_invalid_address,
              defaults, created_at, updated_at
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

function asBoolInt(value, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value === 0 || value === 1) return value;
  if (value === '0' || value === '1') return Number(value);
  return null;
}

function enumOrUndefined(value, allowed) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || !allowed.has(value)) return null;
  return value;
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
  const url = optionalEnv({ env, key: 'PUBLIC_WEBHOOK_URL' });
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
    const row = await db
      .prepare(
        `SELECT organization_id, default_fulfillment_method
         FROM org_settings WHERE organization_id = ?`,
      )
      .bind(org.organizationId)
      .first();
    return ok({
      data: {
        organizationId: org.organizationId,
        defaultFulfillmentMethod: row?.default_fulfillment_method ?? 'unspecified',
      },
    });
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

    const keyBytes = encryptionKeyBytes({ env });
    const apiKeyEncrypted = await encryptSecret({ plaintext: apiKey, keyBytes });
    const defaultsJson = JSON.stringify(DEFAULT_DEFAULTS);

    let inserted;
    try {
      inserted = await db
        .prepare(
          `INSERT INTO shipstation_connection (
             organization_id, api_key_encrypted, rate_timing, rate_mode, best_rate_strategy,
             add_cost_to_shipping_fees, auto_send_return_email, block_on_invalid_address,
             defaults, deleted
           ) VALUES (?, ?, 'shipping', 'rate_shop', 'cheapest', 0, 0, 0, ?, 0)
           RETURNING id, organization_id, rate_timing, rate_mode, best_rate_strategy,
                     add_cost_to_shipping_fees, auto_send_return_email, block_on_invalid_address,
                     defaults, created_at, updated_at`,
        )
        .bind(organizationId, apiKeyEncrypted, defaultsJson)
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

  if (method === 'PATCH' && path === '/connection/settings') {
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
    const row = await liveConnection({ db, organizationId });
    if (!row) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'Connect a ShipStation account first.',
        status: 400,
      });
    }

    const rateTiming = enumOrUndefined(body.rateTiming, RATE_TIMINGS);
    if (rateTiming === null) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'rateTiming must be order_creation or shipping.',
        status: 400,
      });
    }
    const rateMode = enumOrUndefined(body.rateMode, RATE_MODES);
    if (rateMode === null) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'rateMode must be rate_shop, best_rate, or strict_default.',
        status: 400,
      });
    }
    const bestRateStrategy = enumOrUndefined(body.bestRateStrategy, BEST_RATE_STRATEGIES);
    if (bestRateStrategy === null) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'bestRateStrategy must be cheapest or fastest.',
        status: 400,
      });
    }

    const addCost = asBoolInt(body.addCostToShippingFees, undefined);
    if (addCost === null) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'addCostToShippingFees must be a boolean.',
        status: 400,
      });
    }
    const autoEmail = asBoolInt(body.autoSendReturnEmail, undefined);
    if (autoEmail === null) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'autoSendReturnEmail must be a boolean.',
        status: 400,
      });
    }
    const blockAddress = asBoolInt(body.blockOnInvalidAddress, undefined);
    if (blockAddress === null) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'blockOnInvalidAddress must be a boolean.',
        status: 400,
      });
    }

    let defaultsJson = row.defaults;
    if (body.defaults !== undefined) {
      if (body.defaults === null || typeof body.defaults !== 'object' || Array.isArray(body.defaults)) {
        return err({
          code: AppErrorCode.VALIDATION_ERROR,
          message: 'defaults must be an object.',
          status: 400,
        });
      }
      const merged = { ...parseDefaults(row.defaults), ...body.defaults };
      if (merged.defaultCarrierId != null) {
        merged.defaultCarrierId = Number(merged.defaultCarrierId);
      }
      if (merged.defaultServiceId != null) {
        merged.defaultServiceId = Number(merged.defaultServiceId);
      }
      if (merged.defaultCarrierId != null || merged.defaultServiceId != null) {
        const carriers = await loadCarriers({ db, connectionId: row.id });
        if (merged.defaultCarrierId != null) {
          const match = carriers.find((c) => c.id === merged.defaultCarrierId);
          if (!match) {
            return err({
              code: AppErrorCode.VALIDATION_ERROR,
              message: 'defaultCarrierId must belong to this connection.',
              status: 400,
            });
          }
        }
        if (merged.defaultServiceId != null) {
          const service = carriers
            .flatMap((c) => c.services)
            .find((s) => s.id === merged.defaultServiceId);
          if (!service) {
            return err({
              code: AppErrorCode.VALIDATION_ERROR,
              message: 'defaultServiceId must belong to this connection.',
              status: 400,
            });
          }
          if (
            merged.defaultCarrierId != null &&
            service.carrierId !== merged.defaultCarrierId
          ) {
            return err({
              code: AppErrorCode.VALIDATION_ERROR,
              message: 'defaultServiceId must belong to the selected default carrier.',
              status: 400,
            });
          }
        }
      }
      defaultsJson = JSON.stringify(merged);
    }

    const updated = await db
      .prepare(
        `UPDATE shipstation_connection SET
           rate_timing = ?,
           rate_mode = ?,
           best_rate_strategy = ?,
           add_cost_to_shipping_fees = ?,
           auto_send_return_email = ?,
           block_on_invalid_address = ?,
           defaults = ?,
           updated_at = datetime('now')
         WHERE id = ? AND deleted = 0
         RETURNING id, organization_id, rate_timing, rate_mode, best_rate_strategy,
                   add_cost_to_shipping_fees, auto_send_return_email, block_on_invalid_address,
                   defaults, created_at, updated_at`,
      )
      .bind(
        rateTiming ?? row.rate_timing,
        rateMode ?? row.rate_mode,
        bestRateStrategy ?? row.best_rate_strategy,
        addCost === undefined ? row.add_cost_to_shipping_fees : addCost,
        autoEmail === undefined ? row.auto_send_return_email : autoEmail,
        blockAddress === undefined ? row.block_on_invalid_address : blockAddress,
        defaultsJson,
        row.id,
      )
      .first();

    const count = await carrierCount({ db, connectionId: row.id });
    return ok({ data: publicConnection(updated, { carrierCount: count }) });
  }

  if (method === 'PATCH' && path === '/org-settings') {
    const parsed = await parseJsonResponse({
      value: request.json(),
      fields: {
        organizationId: (obj) => requiredString({ obj, key: 'organizationId' }),
        defaultFulfillmentMethod: (obj) =>
          optionalString({ obj, key: 'defaultFulfillmentMethod', default: 'unspecified' }),
      },
    });
    if (!parsed.ok) {
      return err({ code: parsed.error.code, message: parsed.error.message, status: 400 });
    }
    const { organizationId, defaultFulfillmentMethod } = parsed.value;
    if (!FULFILLMENT_METHODS.has(defaultFulfillmentMethod)) {
      return err({
        code: AppErrorCode.VALIDATION_ERROR,
        message: 'defaultFulfillmentMethod must be unspecified, shipstation, or manual.',
        status: 400,
      });
    }
    await db
      .prepare(
        `INSERT INTO org_settings (organization_id, default_fulfillment_method)
         VALUES (?, ?)
         ON CONFLICT(organization_id) DO UPDATE SET
           default_fulfillment_method = excluded.default_fulfillment_method,
           updated_at = datetime('now')`,
      )
      .bind(organizationId, defaultFulfillmentMethod)
      .run();
    return ok({
      data: { organizationId, defaultFulfillmentMethod },
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
        keyBytes: encryptionKeyBytes({ env }),
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
