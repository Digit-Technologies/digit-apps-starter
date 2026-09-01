/**
 * Channel adapter registry. Outbound hooks run after Digit shipment writeback;
 * inbound store webhooks use createChannelWebhookHandler per adapter.
 */

import { appendActivity } from '../activity.js';
import { createWebhookHandler, parseJsonBody } from '../webhooks/pipeline.js';
import { readChannelSecrets, shipstationDb } from '../runtimeConfig.js';
import { faireAdapter } from './faire.js';
import { listChannelConnections, markWebhookDeliveryProcessed, organizationIdForChannelWebhook } from './store.js';
import { shopifyAdapter } from './shopify.js';
import { woocommerceAdapter } from './woocommerce.js';

/** @type {import('./types.js').ChannelAdapter[]} */
const ADAPTERS = [faireAdapter, shopifyAdapter, woocommerceAdapter];

export function listAdapters() {
  return ADAPTERS;
}

/** @param {string} channelId */
export function getAdapter(channelId) {
  return ADAPTERS.find((adapter) => adapter.id === channelId) ?? null;
}

export function adaptersWithWebhooks() {
  return ADAPTERS.filter((adapter) => adapter.webhookPath && adapter.verifyWebhook);
}

function defaultExtractIds(payload) {
  return {
    event: String(payload?.event || payload?.topic || ''),
    externalOrderId: payload?.id ? String(payload.id) : null,
  };
}

function defaultIdempotencyKey(headers, ids) {
  return String(`${ids.event}:${ids.externalOrderId || 'none'}`).slice(0, 128);
}

function resultStatus(result) {
  if (result.status) return result.status;
  if (result.skipped) return 'skipped';
  return 'success';
}

/**
 * Run all configured outbound channel adapters after Digit shipment writeback.
 * @param {import('./types.js').AfterDigitShippedContext} ctx
 */
export async function runAfterDigitShipped({ env, order, shipment, organizationId = null }) {
  const db = shipstationDb({ env });
  const results = [];

  for (const adapter of ADAPTERS) {
    if (!adapter.afterDigitShipped) continue;

    let configured = false;
    try {
      configured = await adapter.isConfigured({ env, db });
    } catch {
      configured = false;
    }
    if (!configured) continue;

    let result;
    try {
      result = await adapter.afterDigitShipped({
        env,
        db,
        organizationId,
        order,
        shipment,
      });
    } catch (error) {
      result = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Channel adapter failed.',
      };
    }

    const status = resultStatus(result);
    results.push({ channelId: adapter.id, status, ...result });

    if (organizationId && db && status === 'error') {
      await appendActivity({
        db,
        organizationId,
        actor: 'channel',
        action: 'channel.fulfillment',
        status: 'error',
        message: result.message || `${adapter.label} fulfillment failed.`,
        digitOrderId: typeof order?.id === 'string' ? order.id : null,
        channelId: adapter.id,
        externalOrderId: result.externalOrderId ?? null,
      });
    }

    if (organizationId && db && status === 'success') {
      await appendActivity({
        db,
        organizationId,
        actor: 'channel',
        action: 'channel.fulfillment',
        status: 'success',
        message: result.message || `${adapter.label} fulfillment updated.`,
        digitOrderId: typeof order?.id === 'string' ? order.id : null,
        channelId: adapter.id,
        externalOrderId: result.externalOrderId ?? null,
      });
    }
  }

  return results;
}

/** @deprecated Prefer runAfterDigitShipped. */
export async function afterDigitShipped(ctx) {
  return runAfterDigitShipped(ctx);
}

/**
 * @param {string} channelId
 */
export function createChannelWebhookHandler(channelId) {
  const adapter = getAdapter(channelId);
  if (!adapter?.webhookPath || !adapter.verifyWebhook) {
    throw new Error(`No inbound webhook adapter registered for "${channelId}".`);
  }

  return createWebhookHandler({
    verify: async ({ headers, body, env }) =>
      adapter.verifyWebhook({
        env,
        db: shipstationDb({ env }),
        headers,
        body,
      }),
    parsePayload: parseJsonBody,
    extractIds: adapter.extractWebhookIds ?? defaultExtractIds,
    jobName: `process-${channelId}-webhook`,
    idempotencyKey: adapter.webhookIdempotencyKey ?? defaultIdempotencyKey,
    resolveOrganizationId: async ({ env }) =>
      organizationIdForChannelWebhook({ env, db: shipstationDb({ env }) }),
    channelId,
    runInline: async (payload, env) => {
      await processChannelWebhook({ payload, env });
    },
  });
}

export function channelWebhookHandlers() {
  /** @type {Record<string, ReturnType<typeof createChannelWebhookHandler>>} */
  const handlers = {};
  for (const adapter of adaptersWithWebhooks()) {
    if (adapter.webhookPath) {
      handlers[adapter.webhookPath] = createChannelWebhookHandler(adapter.id);
    }
  }
  return handlers;
}

export function channelJobHandlers() {
  /** @type {Record<string, (ctx: { payload: Record<string, unknown>, env: Record<string, unknown> }) => Promise<unknown>>} */
  const jobs = {};
  for (const adapter of adaptersWithWebhooks()) {
    jobs[`process-${adapter.id}-webhook`] = ({ payload, env }) =>
      processChannelWebhook({ payload, env, channelId: adapter.id });
  }
  return jobs;
}

/**
 * @param {object} args
 * @param {Record<string, unknown>} args.payload
 * @param {Record<string, unknown>} args.env
 * @param {string} [args.channelId]
 */
export async function processChannelWebhook({ payload, env, channelId }) {
  const resolvedChannelId = channelId || (typeof payload.channelId === 'string' ? payload.channelId : null);
  const adapter = resolvedChannelId ? getAdapter(resolvedChannelId) : null;
  const db = shipstationDb({ env });
  const organizationId =
    typeof payload.organizationId === 'string' ? payload.organizationId : null;

  if (!adapter?.onInboundOrder) {
    if (organizationId && db) {
      await appendActivity({
        db,
        organizationId,
        actor: 'webhook',
        action: 'channel.inbound',
        status: 'error',
        message: 'Unknown or unsupported channel webhook.',
        channelId: resolvedChannelId,
      });
    }
    return { ok: false, reason: 'unknown_channel' };
  }

  let inboundPayload = {};
  if (payload.payload && typeof payload.payload === 'object') {
    inboundPayload = /** @type {Record<string, unknown>} */ (payload.payload);
  }

  let result;
  try {
    result = await adapter.onInboundOrder({
      env,
      db,
      organizationId,
      ids: payload,
      payload: inboundPayload,
    });
  } catch (error) {
    result = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Inbound channel job failed.',
    };
  }

  const status = resultStatus(result);
  const deliveryId = typeof payload.deliveryId === 'string' ? payload.deliveryId : null;

  if (db && resolvedChannelId && deliveryId) {
    await markWebhookDeliveryProcessed({ db, channelId: resolvedChannelId, deliveryId });
  }

  if (organizationId && db) {
    await appendActivity({
      db,
      organizationId,
      actor: 'webhook',
      action: 'channel.inbound',
      status,
      message:
        result.message ||
        result.reason ||
        `${adapter.label} inbound ${status === 'skipped' ? 'skipped' : 'processed'}.`,
      channelId: resolvedChannelId,
      externalOrderId:
        result.externalOrderId ||
        (typeof payload.externalOrderId === 'string' ? payload.externalOrderId : null),
    });
  }

  return { ok: status !== 'error', result };
}

export async function channelSetupEntries({ env, db }) {
  const entries = [];
  for (const adapter of ADAPTERS) {
    const secrets = await readChannelSecrets({ env, db, channelId: adapter.id });
    let configured = false;
    try {
      configured = await adapter.isConfigured({ env, db });
    } catch {
      configured = false;
    }
    entries.push({
      id: adapter.id,
      label: adapter.label,
      webhookPath: adapter.webhookPath,
      configured,
      secrets,
    });
  }
  return entries;
}

export async function channelStatusForOrg({ env, db, organizationId }) {
  const entries = await channelSetupEntries({ env, db });
  const connections = organizationId
    ? await listChannelConnections({ db, organizationId })
    : [];
  return {
    channels: entries.map((entry) => ({
      ...entry,
      connections: connections.filter((row) => row.channelId === entry.id),
    })),
  };
}
