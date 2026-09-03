/**
 * Verify → enqueue → 200 fast. Never log webhook bodies.
 * Pass `query` into verify so V1 ShipStation token checks can run.
 */

import { digitJobs, optionalEnv } from '@digit/lib-backend';

import { jobsUnavailable } from '../jobs.js';
import { recordWebhookDelivery, webhookAlreadyProcessed } from '../channels/store.js';

/**
 * @param {object} args
 * @param {(ctx: { headers: Record<string, string>, body: Uint8Array, env: Record<string, unknown>, query?: string }) => Promise<boolean>} args.verify
 * @param {(body: Uint8Array) => Record<string, unknown>} args.parsePayload
 * @param {(payload: Record<string, unknown>) => Record<string, unknown>} args.extractIds
 * @param {string} args.jobName
 * @param {(headers: Record<string, string>, ids: Record<string, unknown>) => string} args.idempotencyKey
 * @param {() => Promise<string | null>} [args.resolveOrganizationId]
 * @param {(payload: Record<string, unknown>, env: Record<string, unknown>) => Promise<void>} [args.runInline]
 * @param {string | null} [args.channelId]
 */
export function createWebhookHandler({
  verify,
  parsePayload,
  extractIds,
  jobName,
  idempotencyKey,
  resolveOrganizationId,
  runInline,
  channelId = null,
}) {
  return async function webhookHandler({ headers, body, env, query }) {
    const db = optionalEnv({ env, key: 'SHIPSTATION_DB' }) || null;
    const valid = await verify({ headers, body, env, query: query || '' });
    if (!valid) {
      return { status: 401, headers: { 'content-type': 'text/plain' }, body: 'invalid signature' };
    }

    let payload = {};
    try {
      payload = parsePayload(body);
    } catch {
      return { status: 200, headers: { 'content-type': 'text/plain' }, body: 'ok' };
    }

    const ids = extractIds(payload);
    const organizationId = resolveOrganizationId ? await resolveOrganizationId({ env }) : null;
    const deliveryKey = idempotencyKey(headers, ids);

    if (db && channelId && deliveryKey) {
      const duplicate = await webhookAlreadyProcessed({ db, channelId, deliveryId: deliveryKey });
      if (duplicate) {
        return { status: 200, headers: { 'content-type': 'text/plain' }, body: 'ok' };
      }
    }

    const jobPayload = {
      ...ids,
      organizationId,
      channelId,
      deliveryId: deliveryKey || null,
    };

    try {
      await digitJobs({ env }).submit({
        name: jobName,
        payload: jobPayload,
        idempotencyKey: deliveryKey.slice(0, 128),
      });
      if (db && channelId && deliveryKey) {
        await recordWebhookDelivery({ db, channelId, deliveryId: deliveryKey });
      }
    } catch (error) {
      if (jobsUnavailable(error) && runInline) {
        await runInline(jobPayload, env);
        if (db && channelId && deliveryKey) {
          await recordWebhookDelivery({ db, channelId, deliveryId: deliveryKey, processed: true });
        }
      }
    }

    return { status: 200, headers: { 'content-type': 'text/plain' }, body: 'ok' };
  };
}

export function parseJsonBody(body) {
  return JSON.parse(new TextDecoder().decode(body));
}
