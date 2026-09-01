# Webhooks

## Inbound (Digit)

Declared in `manifest.json` as `backend.webhooks: [{ "path": "shipstation" }]`.

```
POST https://{app-id}.<apps domain>/webhooks/shipstation
```

Handler: `src/backend/webhooks.js`.

1. Verify ShipStation V2 RSA-SHA256 over **raw** body bytes (`x-shipengine-rsa-sha256-key-id`,
   `x-shipengine-rsa-sha256-signature`, `x-shipengine-timestamp`, JWKS). On failure: 401.
2. Parse JSON only after verify. Do not log the body.
3. `digitJobs.submit({ name: 'process-ss-webhook', payload })` (ids only, not addresses).
   If `__JOBS` is missing (local), run `processSsWebhook` inline.
4. Return 200 within the delivery budget.

`verifyWebhookSignature` (HMAC) is the wrong scheme for ShipStation V2.

## Outbound (register with ShipStation)

On connect, if `PUBLIC_WEBHOOK_URL` is set, register:

- `label_created_v2`
- `track`
- `fulfillment_shipped_v2`
- `shipment_created_v2`
- `sales_orders_imported`

Disconnect deletes stored webhook ids.
