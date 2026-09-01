# Channel inbound webhooks

Store webhooks use the same Digit platform rules as ShipStation — see create-digit-app
[webhooks.md](../../../../../.agents/skills/create-digit-app/reference/webhooks.md).

## Template pipeline

`src/backend/webhooks/pipeline.js` — `createWebhookHandler`:

1. **Verify** over raw `body` bytes (`401` on failure — no activity, no enqueue).
2. Parse JSON only after verify.
3. Extract **ids only** (event, external order id) — never log the body.
4. Dedupe via `webhook_delivery` when `channelId` + delivery id are present.
5. `digitJobs.submit({ name: 'process-{channelId}-webhook', … })`.
6. Return `200` within ~10s.

Channel-specific verify lives on the adapter (`channels/{platform}.js`). ShipStation V2 RSA
stays in `webhooks/shipstation.js` — not HMAC.

## Register a path

```json
{
  "backend": {
    "webhooks": [
      { "path": "shipstation" },
      { "path": "shopify" }
    ]
  }
}
```

Max **10** paths per app. Undeclared paths 404 at the platform edge.

Wire the handler in `registry.js` (`webhookPath` on the adapter) and `index.js`
(`channelWebhookHandlers()`).

## Idempotency keys

| Platform | Prefer |
| --- | --- |
| Shopify | `X-Shopify-Webhook-Id` |
| WooCommerce | `X-WC-Webhook-Id` |
| Generic | `{event}:{externalOrderId}` |

Store in `webhook_delivery` to collapse provider retries.

## Jobs

| Job | Trigger |
| --- | --- |
| `process-ss-webhook` | ShipStation inbound |
| `process-{channelId}-webhook` | Store inbound |
| `poll-outbound-push` | Scheduled Digit → SS push |

Job handler: `processChannelWebhook` in `channels/registry.js`.

## Activity actions

- `channel.inbound` — after inbound job
- `channel.fulfillment` — after outbound adapter
- `channel.webhook.rejected` — optional; invalid verify stays 401 with no row

## Local dev

No webhook ingress under `wrangler dev`. Export handlers as plain functions and unit-test
with fixtures in `channels/__fixtures/`.
