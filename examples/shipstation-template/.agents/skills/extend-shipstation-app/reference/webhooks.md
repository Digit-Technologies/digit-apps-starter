# Webhooks

## Inbound (Digit)

Declared in `manifest.json` as `backend.webhooks: [{ "path": "shipstation" }]`.

```
POST https://{app-id}.<apps domain>/webhooks/shipstation
```

Undeclared paths 404 at the platform edge. POST only. Max 10 slugs per app; lowercase
`[a-z0-9-]`, one segment, max 32 chars.

Handler: `src/backend/webhooks.js` → `createHandler({ webhooks: { shipstation } })`.

**Today the handler is a stub** — it returns HTTP 200 and does not verify or persist.
When adding logic:

1. Look up ShipStation’s signature scheme on the **docs MCP** (do not guess HMAC headers).
2. Verify over the **raw** `body` `Uint8Array` before `JSON.parse`. On failure: 401, do
   nothing else (do not enqueue).
3. Return 2xx within the ~10s delivery budget.
4. Heavy work: `digitJobs({ env }).submit({ name, payload, idempotencyKey })` after verify.
   Use the provider delivery id as `idempotencyKey` when they send one.
5. Do not log `body` (tracking, addresses).

`verifyWebhookSignature` in `@digit/lib-backend` is HMAC over raw bytes. If ShipStation
uses a different scheme, implement that check explicitly after MCP lookup.

There is no local webhook ingress. Keep the handler an exported function so it can be
unit-tested.

## Outbound (register with ShipStation)

On connect, if `PUBLIC_WEBHOOK_URL` is set, `registerWebhooks` POSTs:

- `label_created_v2`
- `track`

to `POST /v2/environment/webhooks` with that URL, and stores ids in `shipstation_webhook`.
Disconnect `DELETE`s those ids.

New events: confirm the event name via docs MCP, extend `WEBHOOK_EVENTS` in
`connection.js`, persist the id, and deregister on disconnect. Inbound handling still
lands on the same Digit path unless you declare another slug.
