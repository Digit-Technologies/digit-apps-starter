/**
 * Optional WooCommerce adapter stub. Enable by setting WOOCOMMERCE_WEBHOOK_SECRET
 * (and store URL / consumer keys as needed), declaring path `woocommerce` in
 * manifest.json, and implementing the API calls. See reference/channel-recipes.md.
 *
 * @typedef {import('./types.js').ChannelAdapter} ChannelAdapter
 */

import { readChannelSecrets, shipstationDb } from '../runtimeConfig.js';

/** @type {ChannelAdapter} */
export const woocommerceAdapter = {
  id: 'woocommerce',
  label: 'WooCommerce',
  secretKeys: ['WOOCOMMERCE_WEBHOOK_SECRET', 'WOOCOMMERCE_CONSUMER_KEY', 'WOOCOMMERCE_CONSUMER_SECRET'],
  webhookPath: 'woocommerce',

  async isConfigured({ env }) {
    const db = shipstationDb({ env });
    const secrets = await readChannelSecrets({ env, db, channelId: 'woocommerce' });
    return secrets.some((entry) => entry.key === 'WOOCOMMERCE_WEBHOOK_SECRET' && entry.present);
  },

  async verifyWebhook({ env, headers, body }) {
    void env;
    void headers;
    void body;
    return false;
  },

  extractWebhookIds(payload) {
    return {
      event: String(payload?.status || payload?.topic || 'order'),
      externalOrderId: payload?.id ? String(payload.id) : null,
    };
  },

  webhookIdempotencyKey(headers, ids) {
    return String(headers['x-wc-webhook-id'] || `${ids.event}:${ids.externalOrderId || 'none'}`).slice(
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
      reason: 'WooCommerce inbound import is a recipe — implement in a clone.',
    };
  },

  async afterDigitShipped({ env, order, shipment }) {
    void env;
    void order;
    void shipment;
    return {
      status: 'skipped',
      skipped: true,
      reason: 'WooCommerce fulfillment push is a recipe — implement in a clone or use Digit Rutter.',
    };
  },
};
