# Backend routes

Handlers live in `src/backend/connection.js` and `src/backend/setup.js`.
`src/backend/index.js` dispatches: setup first, then connection, else `NOT_FOUND`.

All JSON responses use `ok` / `err` from `@digit/lib-backend`. The Worker does not
authenticate the viewing user.

`organizationId` is a query param on GETs and a JSON field on writes.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/setup` | Reports whether `SHIPSTATION_DB`, `APP_SECRET_ENCRYPTION_KEY`, and optional `PUBLIC_WEBHOOK_URL` are present/valid. Does not `requireEnv` the secret (missing key is data, not a 500). Optional webhook URL does not block. |
| `GET` | `/connection?organizationId=` | Live connection (no API key). `{ connected: false }` if none. |
| `POST` | `/connection` | Body: `organizationId`, `apiKey`. Validates with `GET /v2/carriers`, encrypts, inserts, syncs carriers, registers webhooks if `PUBLIC_WEBHOOK_URL` is set. 409 if a live connection already exists. |
| `PATCH` | `/connection/settings` | Behavior flags + `defaults` (carrier/service must belong to this connection). |
| `DELETE` | `/connection` | Body: `organizationId`. Deregisters webhooks, soft-deletes connection/carriers/services. Leaves `shipment_label` rows. |
| `GET` | `/carriers?organizationId=` | Cached carrier + service catalog for the live connection. |
| `GET` | `/org-settings?organizationId=` | Default fulfillment method (`unspecified` \| `shipstation` \| `manual`). |
| `PATCH` | `/org-settings` | Upsert that fulfillment method. |

## Adding a route

1. Match `method` + `path` in `handleConnection` or a new module imported from `index.js`.
2. Return `ok({ data })` or `err({ code, message, status })`.
3. Call from the UI with `useBackendQuery` / `useBackendMutation` — do not hand-roll
   `/proxy/backend`.
4. Never include encrypted or plaintext API keys in `data`.
