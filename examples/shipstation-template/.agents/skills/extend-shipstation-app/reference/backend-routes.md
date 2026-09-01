# Backend routes

Handlers live in `src/backend/connection.js`, `handleSync.js`, and `setup.js`.
`src/backend/index.js` dispatches: setup → sync → connection, else `NOT_FOUND`.

All JSON responses use `ok` / `err` from `@digit/lib-backend`. The Worker does not
authenticate the viewing user.

`organizationId` is a query param on GETs and a JSON field on writes.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/setup` | Read-only status for `API_TOKEN_DIGIT` / `PUBLIC_WEBHOOK_URL`: `present`, `source`, `enables`, plus `ready` / `usable`. Never lists `SHIPSTATION_DB` or any value. |
| `POST` | `/setup` | Rejected. App owners manage these values in Digit's built-in App Secrets UI. |
| `GET` | `/connection?organizationId=` | Live connection (no API key, no Phase 2 rate fields). `{ connected: false }` if none. |
| `POST` | `/connection` | Body: `organizationId` only. Reads `SHIPSTATION_API_KEY`, validates it with `GET /v2/carriers`, syncs carriers, registers webhooks. 503 if the secret is missing, 409 if a live connection exists. |
| `DELETE` | `/connection` | Deregister webhooks; soft-delete connection/carriers/services. Leaves `shipment_label` and order map rows. |
| `GET` | `/carriers?organizationId=` | Cached carrier catalog (Phase 2; UI does not show pickers). |
| `GET` | `/org-settings?organizationId=` | `defaultFulfillmentMethod`, `syncMode`, `pushWhen`, `laneTagId`. |
| `PATCH` | `/org-settings` | Upsert those Phase 1 settings. |
| `GET` | `/sync/orders?organizationId=&orderIds=` | D1 maps for the listed Digit order ids (comma-separated, max 100). |
| `GET` | `/sync/activity?organizationId=` | Latest ~100 activity events (pushes, settings, webhooks, poll). |
| `POST` | `/sync/push` | Body: `organizationId`, `orderIds[]` (max 25). Always HTTP 200 with `{ results, summary: { pushed, skipped, failed } }`. UI must read per-order `skipped` / `meaning`. |
| `POST` | `/sync/poll` | Run outbound + inbound poll once (same work as the schedule). |

There is **no** `PATCH /connection/settings`. Rate-shop / label-cost / return-email / address-block fields stay in `0001` SQL defaults only.

## Adding a route

1. Match `method` + `path` in `handleConnection`, `handleSync`, or a new module imported from `index.js`.
2. Return `ok({ data })` or `err({ code, message, status })`.
3. Call from the UI with `useBackendQuery` / `useBackendMutation`.
4. Never include encrypted or plaintext API keys in `data`.
5. Operator-facing routes: follow [error-handling.md](error-handling.md) (`appendActivity`, verbose errors, UI meaning).
