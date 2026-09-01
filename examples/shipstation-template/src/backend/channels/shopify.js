/**
 * Optional Shopify adapter stub. Enable by setting SHOPIFY_ACCESS_TOKEN and
 * SHOPIFY_WEBHOOK_SECRET, declaring path `shopify` in manifest.json, and
 * implementing the API calls. See reference/channel-recipes.md.
 *
 * @typedef {import('./types.js').ChannelAdapter} ChannelAdapter
 */

import { readChannelSecrets, shipstationDb } from '../runtimeConfig.js';

/** @type {ChannelAdapter} */
export const shopifyAdapter = {
  id: 'shopify',
  label: 'Shopify',
  secretKeys: ['SHOPIFY_ACCESS_TOKEN', 'SHOPIFY_WEBHOOK_SECRET'],
  webhookPath: 'shopify',

  async isConfigured({ env }) {
    const db = shipstationDb({ env });
    const secrets = await readChannelSecrets({ env, db, channelId: 'shopify' });
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
      event: String(payload?.topic || payload?.event || ''),
      externalOrderId: payload?.id ? String(payload.id) : null,
    };
  },

  webhookIdempotencyKey(headers, ids) {
    return String(headers['x-shopify-webhook-id'] || `${ids.event}:${ids.externalOrderId || 'none'}`).slice(
      0,
      128,
    );
  },

  async onInboundOrder({ env, organizationId, ids, payload }) {
    void env;
    void organizationId;
    void ids;
    void payload;
    return {
      status: 'skipped',
      skipped: true,
      reason: 'Shopify inbound import is a recipe — implement in a clone.',
    };
  },

  async afterDigitShipped({ env, order, shipment }) {
    void env;
    void order;
    void shipment;
    return {
      status: 'skipped',
      skipped: true,
      reason: 'Shopify fulfillment push is a recipe — implement in a clone or use Digit Rutter.',
    };
  },
};
