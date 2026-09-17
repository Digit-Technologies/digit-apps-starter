# Backend routes

Handlers live in `src/backend/connection.js`, `handleSync.js`, and `setup.js`.
`src/backend/index.js` dispatches: setup → channels → sync → connection, else `NOT_FOUND`.

All JSON responses use `ok` / `err` from `@digit/lib-backend`. The Worker does not
authenticate the viewing user.

`organizationId` is a query param on GETs and a JSON field on writes.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/setup` | Read-only status for secrets and `channels[]` adapter configuration (presence only). Includes `shipStationApiMode` (`v1` \| `v2` \| `missing`). |
| `POST` | `/setup` | Rejected. App owners manage these values in Digit's built-in App Secrets UI. |
| `GET` | `/connection?organizationId=` | Live connection (no API key, no Phase 2 rate fields). Includes `apiVersion`. `{ connected: false }` if none. `mismatch` when secrets no longer match the stored API version. |
| `POST` | `/connection` | Body: `organizationId` only. Reads `SHIPSTATION_API_KEY` (and `SHIPSTATION_API_SECRET` for V1), validates with `GET /v2/carriers` or `GET /carriers`, syncs carriers. 503 if the key is missing. |
| `DELETE` | `/connection` | Soft-delete connection/carriers/services. Leaves `shipment_label` and order map rows. |
| `GET` | `/carriers?organizationId=` | Cached carrier catalog (Phase 2; UI does not show pickers). |
| `GET` | `/org-settings?organizationId=` | `defaultFulfillmentMethod` (`scheduled` \| `manual`), `defaultWeightOz`, Digit options, `ssCarriers[]` (each with `services[]`: `serviceCode`, `name`, effective Digit match, `matchSource`, `inheritedFromCarrier`). Carrier-level default is `ssCarriers[].digitOptionId` (`ss_service_code = ''`). `unmappedCarriers` are services that still do not resolve. `carrierMappings` includes `ssServiceCode`. |
| `PATCH` | `/org-settings` | Upsert those settings. Optional `mappings: [{ ssCarrierCode, ssServiceCode, digitOptionId }]`. Empty `ssServiceCode` is the carrier default. Empty `digitOptionId` deletes that map row. |
| `GET` | `/sync/shipments?organizationId=&shipmentIds=` | D1 maps for the listed Digit shipment ids (comma-separated, max 100). Includes `ssLabelId` and `hasLabel`. |
| `GET` | `/sync/activity?organizationId=` | Latest ~100 activity events (pushes, settings, poll). |
| `POST` | `/sync/push` | Body: `organizationId`, `shipmentIds[]` (max 25). Always HTTP 200 with `{ results, summary: { pushed, skipped, failed } }`. Creates the SS shipment/order only (no rate-shop or label purchase). UI must read per-shipment `skipped` / `meaning`. |
| `POST` | `/sync/label` | Body: `organizationId`, `shipmentId`. Returns `{ filename, contentType, pdfBase64 }` for `DigitHost.download`. V2 refetches the label; V1 returns stored PDF. 400 if no label in D1 yet. |
| `POST` | `/sync/packing-slip` | Body: `organizationId`, `orderId`. Worker calls Digit `generateSalesOrderPdf`, fetches the presigned URL outside the iframe CSP, and returns `{ filename, contentType, pdfBase64 }` for `DigitHost.download`. |
| `POST` | `/sync/poll` | Run outbound push (always, including Manual push) and unlabeled-map label pull. Optional body `organizationId` scopes the run. Returns `{ pushed, labelsPulled, labelCandidates, labelIssues[], pendingWritebacks[] }`. |
| `POST` | `/sync/writeback-complete` | Body: `organizationId`, `digitShipmentId`. Called by the frontend after it applies a `pendingWritebacks[]` entry with `updateShipment`. Flips the map row to `shipped`, logs the activity, and notifies channels. |
| `GET` | `/channels/status?organizationId=` | Channel adapter configuration and D1 `channel_connection` rows (read-only). |

**Shipment writeback:** Digit `da_` API tokens cannot call `updateShipment`. The Worker
uses `JWT_TOKEN` (a Clerk JWT; Digit staff generate it and place it on the account).
Refresh also applies staged `pendingWritebacks[]` in the iframe, then
`POST /sync/writeback-complete`. A `label_ready` row is retried until confirmed.

There is **no** `PATCH /connection/settings`. Default weight lives on
`PATCH /org-settings`. Unused `rate_strategy`, dims, sync_mode, push_when, and lane_tag_id
on `org_settings` stay in SQL; do not expose them.

## Adding a route

1. Match `method` + `path` in `handleConnection`, `handleSync`, or a new module imported from `index.js`.
2. Return `ok({ data })` or `err({ code, message, status })`.
3. Call from the UI with `useBackendQuery` / `useBackendMutation`.
4. Never include encrypted or plaintext API keys in `data`.
5. Operator-facing routes: follow [error-handling.md](error-handling.md) (`appendActivity`, verbose errors, UI meaning).
