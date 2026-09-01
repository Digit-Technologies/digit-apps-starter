# Commerce channels (Shopify, WooCommerce, Faire, …)

This template ships **scaffolding** for third-party store integrations. Customer clones
implement platform-specific API calls; the template provides registry, webhooks, D1 maps,
and setup reporting.

## Rutter vs direct adapter

| Path | When to use | What this app does |
| --- | --- | --- |
| **Digit Rutter** | Store already connected in Digit; Rutter `pushFulfillments` covers tracking | Nothing extra — tracking on the Digit shipment is enough |
| **Direct adapter** | Rutter gap, custom store, Faire, B2B marketplace | Implement `afterDigitShipped` / `onInboundOrder` in `src/backend/channels/{platform}.js` |

There is no default — pick per organization and document the choice in `SPEC.md`.

## Inbound vs outbound

| Flow | Trigger | Template hook |
| --- | --- | --- |
| **Inbound** (store → Digit) | Store webhook `POST /webhooks/{path}` | `verifyWebhook` → job `process-{channelId}-webhook` → `onInboundOrder` |
| **Outbound** (tracking → store) | After ShipStation label writeback to Digit | `runAfterDigitShipped` → `afterDigitShipped` on configured adapters |

ShipStation inbound/outbound is unchanged (`/webhooks/shipstation`, push, writeback).

## Files

| Path | Role |
| --- | --- |
| `src/backend/channels/registry.js` | Adapter list, outbound runner, webhook handler factory |
| `src/backend/channels/_scaffold.js` | Copy-paste starter for new platforms |
| `src/backend/channels/store.js` | D1: `channel_order_map`, `webhook_delivery`, `channel_connection` |
| `src/backend/http/platformFetch.js` | Generic upstream HTTP (mirror `ssFetch`) |
| `src/backend/webhooks/pipeline.js` | Verify → enqueue → 200 |
| `src/backend/runtimeConfig.js` | `CHANNEL_SECRETS` registry |
| `GET /setup` | `channels[]` secret presence (no values) |
| `GET /channels/status` | Per-org channel config + connections |

Recipes: [channel-recipes.md](channel-recipes.md) · Webhooks: [channel-webhooks.md](channel-webhooks.md) · API paths: [channel-api-map.md](channel-api-map.md)

## LLM workflow

1. Read this doc — choose Rutter vs direct and inbound vs outbound.
2. Copy `_scaffold.js` → `channels/{platform}.js`; register in `registry.js`.
3. Add app secrets to `CHANNEL_SECRETS` in `runtimeConfig.js` (names only in UI).
4. If inbound: declare `path` in `manifest.json` (max 10 total); implement `verifyWebhook`.
5. Use `channel_order_map` for Digit ↔ store order ids ([d1.md](d1.md)).
6. `appendActivity` with `channelId` / `externalOrderId` — no addresses or secrets.
7. Extend `FeatureStatus` / `GET /setup` only when adding new secret keys.

Fixtures for unit tests: `src/backend/channels/__fixtures/` (handlers are plain functions — no local webhook ingress).
