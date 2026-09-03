# Webhooks

## Inbound (Digit)

Declared in `manifest.json` as `backend.webhooks: [{ "path": "shipstation" }]`.

```
POST https://{app-id}.<apps domain>/webhooks/shipstation
```

Handler: `src/backend/webhooks.js` (`webhooks/shipstation.js` + `webhooks/pipeline.js`).
The pipeline passes the raw `query` string into `verify`.

1. Verify **before** parse. Do not log the body.
   - If ShipEngine RSA headers are present (`x-shipengine-rsa-sha256-key-id`,
     `x-shipengine-rsa-sha256-signature`, `x-shipengine-timestamp`) → V2 RSA-SHA256
     over raw body bytes + JWKS.
   - Else timing-safe compare of query `token` to `SHIPSTATION_WEBHOOK_TOKEN` (V1).
   - Else 401 (`invalid signature`).
2. Parse JSON only after verify. V1 payloads are often thin:
   `{ resource_url, resource_type }`.
3. `digitJobs.submit({ name: 'process-ss-webhook', payload })` (ids + `resourceUrl`
   only, not addresses). The job GETs `resource_url` with live credentials (SSRF
   allowlist includes `ssapi.shipstation.com`). If `__JOBS` is missing (local), run
   `processSsWebhook` inline.
4. Return 200 within the delivery budget.

After the job runs, `appendActivity` with event + ids only (no tracking, no payload).
Invalid signature/token stays 401 with no activity row. See [error-handling.md](error-handling.md).

`verifyWebhookSignature` (HMAC) is the wrong scheme for ShipStation V2 **and** V1.

## Outbound (register with ShipStation)

On connect, if `PUBLIC_WEBHOOK_URL` is set:

**V2:** register `label_created_v2`, `track`, `fulfillment_shipped_v2`,
`shipment_created_v2`, `sales_orders_imported`.

**V1:** append `?token=<SHIPSTATION_WEBHOOK_TOKEN>` to the public URL, then subscribe
to `SHIP_NOTIFY`, `ORDER_NOTIFY`, `FULFILLMENT_SHIPPED`. Connect fails if the token is
missing while a public URL is set.

Disconnect deletes stored webhook ids via the version-appropriate delete API.
