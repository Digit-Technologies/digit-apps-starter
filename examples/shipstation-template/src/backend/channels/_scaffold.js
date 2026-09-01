/**
 * Copy this file to `channels/{platform}.js`, register in `registry.js`, and implement
 * the platform-specific API calls. Look up webhook verification and REST paths in
 * `.agents/skills/extend-shipstation-app/reference/channel-recipes.md`.
 *
 * @typedef {import('./types.js').ChannelAdapter} ChannelAdapter
 */

import { readChannelSecrets, shipstationDb } from '../runtimeConfig.js';

/** @type {ChannelAdapter} */
export const scaffoldAdapter = {
  id: 'example',
  label: 'Example store',
  secretKeys: ['EXAMPLE_API_TOKEN', 'EXAMPLE_WEBHOOK_SECRET'],
  webhookPath: 'example',

  async isConfigured({ env }) {
    const db = shipstationDb({ env });
    const secrets = await readChannelSecrets({ env, db, channelId: 'example' });
    return secrets.every((entry) => entry.present);
  },

  async verifyWebhook({ env, headers, body }) {
    void env;
    void headers;
    void body;
    return false;
  },

  extractWebhookIds(payload) {
    return {
      event: String(payload?.event || payload?.topic || ''),
      externalOrderId: payload?.id ? String(payload.id) : null,
    };
  },

  webhookIdempotencyKey(headers, ids) {
    return String(
      headers['x-example-delivery-id'] ||
        `${ids.event}:${ids.externalOrderId || 'none'}`,
    ).slice(0, 128);
  },

  async onInboundOrder({ env, organizationId, ids, payload }) {
    void env;
    void organizationId;
    void ids;
    void payload;
    return {
      status: 'skipped',
      skipped: true,
      reason: 'Implement onInboundOrder in your channel adapter.',
    };
  },

  async afterDigitShipped({ env, order, shipment }) {
    void env;
    void order;
    void shipment;
    return {
      status: 'skipped',
      skipped: true,
      reason: 'Implement afterDigitShipped in your channel adapter.',
    };
  },
};
