# Backend routes

Handlers live in `src/backend/connection.js`, `handleSync.js`, and `setup.js`.
`src/backend/index.js` dispatches: setup → sync → connection, else `NOT_FOUND`.

All JSON responses use `ok` / `err` from `@digit/lib-backend`. The Worker does not
authenticate the viewing user.

`organizationId` is a query param on GETs and a JSON field on writes.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/setup` | Pasteable config only (`API_TOKEN_DIGIT`, `PUBLIC_WEBHOOK_URL`). Never lists `SHIPSTATION_DB`. |
| `POST` | `/setup` | Body: `apiTokenDigit`, `publicWebhookUrl` (omit a field to keep the stored value). |
| `GET` | `/connection?organizationId=` | Live connection (no API key, no Phase 2 rate fields). `{ connected: false }` if none. |
| `POST` | `/connection` | Validate key with `GET /v2/carriers`, encrypt, sync carriers, register webhooks. 409 if live connection exists. |
| `DELETE` | `/connection` | Deregister webhooks; soft-delete connection/carriers/services. Leaves `shipment_label` and order map rows. |
| `GET` | `/carriers?organizationId=` | Cached carrier catalog (Phase 2; UI does not show pickers). |
| `GET` | `/org-settings?organizationId=` | `defaultFulfillmentMethod`, `syncMode`, `pushWhen`, `laneTagId`. |
| `PATCH` | `/org-settings` | Upsert those Phase 1 settings. |
| `GET` | `/sync/orders?organizationId=&orderIds=` | D1 maps for the listed Digit order ids (comma-separated, max 100). |
| `POST` | `/sync/push` | Body: `organizationId`, `orderIds[]` (max 25). Pushes eligible Digit SOs to ShipStation. |
| `POST` | `/sync/poll` | Run outbound + inbound poll once (same work as the schedule). |

There is **no** `PATCH /connection/settings`. Rate-shop / label-cost / return-email / address-block fields stay in `0001` SQL defaults only.

## Adding a route

1. Match `method` + `path` in `handleConnection`, `handleSync`, or a new module imported from `index.js`.
2. Return `ok({ data })` or `err({ code, message, status })`.
3. Call from the UI with `useBackendQuery` / `useBackendMutation`.
4. Never include encrypted or plaintext API keys in `data`.
