# Channel extension recipes

Checklists only. Look up request/response shapes in vendor docs — do not invent bodies.

## Add a channel adapter (any platform)

1. Copy `src/backend/channels/_scaffold.js` → `channels/{platform}.js`.
2. Set `id`, `label`, `secretKeys`, optional `webhookPath`.
3. Register the adapter in `CHANNEL_ADAPTERS` in `registry.js`.
4. Add secret key names to `CHANNEL_SECRETS` in `runtimeConfig.js`.
5. Implement `isConfigured` (all required secrets present).
6. Outbound: implement `afterDigitShipped` using `platformFetch` + `channel_order_map`.
7. Inbound: implement `verifyWebhook`, `extractWebhookIds`, `onInboundOrder`.
8. Declare webhook `path` in `manifest.json` when inbound is ready.
9. `appendActivity` on success/error; UI Alert + activity refetch.
10. Document secrets and flows in `SPEC.md`.

## Shopify

**Secrets:** `SHOPIFY_ACCESS_TOKEN`, `SHOPIFY_WEBHOOK_SECRET`  
**Manifest path:** `shopify` → `POST /webhooks/shopify`  
**Verify:** HMAC-SHA256 of raw body; header `X-Shopify-Hmac-Sha256` (base64). Use `verifyWebhookSignature` with the webhook secret.  
**Idempotency:** header `X-Shopify-Webhook-Id`  
**Outbound:** Admin REST/GraphQL fulfillment create — look up current Shopify fulfillment API.  
**Stub:** `src/backend/channels/shopify.js`  
**Fixture:** `channels/__fixtures__/shopify-order-created.json`

## WooCommerce

**Secrets:** `WOOCOMMERCE_WEBHOOK_SECRET` (required for verify); optional `WOOCOMMERCE_CONSUMER_KEY`, `WOOCOMMERCE_CONSUMER_SECRET` for REST  
**Manifest path:** `woocommerce`  
**Verify:** HMAC-SHA256 base64; header `X-WC-Webhook-Signature`; `verifyWebhookSignature({ encoding: 'base64' })`.  
**Idempotency:** header `X-WC-Webhook-Id`  
**Outbound:** WooCommerce order notes or shipment tracking REST — look up current docs.  
**Stub:** `src/backend/channels/woocommerce.js`  
**Fixture:** `channels/__fixtures__/woocommerce-order-created.json`

## Faire (outbound only)

**Secret:** `FAIRE_API_KEY`  
**Hook:** `faireAdapter.afterDigitShipped` via registry (no inbound webhook).  
Implement POST against Faire order-shipment API in `channels/faire.js`.

## Digit Rutter (no adapter code)

When the store is connected in Digit and Rutter pushes fulfillments:

- Finish ShipStation writeback (tracking on Digit shipment).
- Leave channel adapters unconfigured — registry skips them.

## D1 mapping

Use `channel_order_map` when the store order id differs from Digit order id:

```sql
-- see migration 0005_channel_integration.sql
```

Helper: `upsertChannelOrderMap` in `channels/store.js`.

## Replace Faire one-liner

The old “implement `notifyFaire`” recipe is superseded by the adapter registry. Use
`faireAdapter` or add a new adapter file following the checklist above.
