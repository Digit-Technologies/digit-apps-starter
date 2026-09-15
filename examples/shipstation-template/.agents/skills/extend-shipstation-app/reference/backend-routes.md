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
| `POST` | `/connection` | Body: `organizationId` only. Reads `SHIPSTATION_API_KEY` (and `SHIPSTATION_API_SECRET` for V1), validates with `GET /v2/carriers` or `GET /carriers`, syncs carriers, registers version-appropriate webhooks. 503 if the key is missing (or V1 webhook token missing when a public URL is set), 409 if a live connection exists. |
| `DELETE` | `/connection` | Deregister webhooks; soft-delete connection/carriers/services. Leaves `shipment_label` and order map rows. |
| `GET` | `/carriers?organizationId=` | Cached carrier catalog (Phase 2; UI does not show pickers). |
| `GET` | `/org-settings?organizationId=` | Fulfillment/sync/push/lane plus `defaultWeightOz`, optional dims, `rateStrategy`, Digit/SS carrier lists, `carrierMappings`, `unmappedCarriers`. |
| `PATCH` | `/org-settings` | Upsert those settings. Optional `mappings: [{ ssCarrierCode, digitOptionId }]` stored as manual rows in `carrier_digit_map`. |
| `GET` | `/sync/shipments?organizationId=&shipmentIds=` | D1 maps for the listed Digit shipment ids (comma-separated, max 100). Includes `ssLabelId` and `hasLabel`. |
| `GET` | `/sync/activity?organizationId=` | Latest ~100 activity events (pushes, settings, webhooks, poll). |
| `POST` | `/sync/push` | Body: `organizationId`, `shipmentIds[]` (max 25). Always HTTP 200 with `{ results, summary: { pushed, skipped, failed } }`. Creates the SS shipment/order, then rate-shops and buys a label. UI must read per-shipment `skipped` / `meaning` / `labelPurchased`. |
| `POST` | `/sync/label` | Body: `organizationId`, `shipmentId`. Returns `{ filename, contentType, pdfBase64 }` for `DigitHost.download`. V2 refetches the label; V1 returns stored PDF. |
| `POST` | `/sync/packing-slip` | Body: `organizationId`, `orderId`. Worker calls Digit `generateSalesOrderPdf`, fetches the presigned URL outside the iframe CSP, and returns `{ filename, contentType, pdfBase64 }` for `DigitHost.download`. |
| `POST` | `/sync/poll` | Run outbound + inbound poll once (same work as the schedule). |
| `GET` | `/channels/status?organizationId=` | Channel adapter configuration and D1 `channel_connection` rows (read-only). |

There is **no** `PATCH /connection/settings`. Rate-shop strategy, default weight, and optional dims live on `PATCH /org-settings`. Label-cost / return-email / address-block fields stay in `0001` SQL defaults only.

## Adding a route

1. Match `method` + `path` in `handleConnection`, `handleSync`, or a new module imported from `index.js`.
2. Return `ok({ data })` or `err({ code, message, status })`.
3. Call from the UI with `useBackendQuery` / `useBackendMutation`.
4. Never include encrypted or plaintext API keys in `data`.
5. Operator-facing routes: follow [error-handling.md](error-handling.md) (`appendActivity`, verbose errors, UI meaning).
