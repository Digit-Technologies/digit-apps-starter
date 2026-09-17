# Architecture

Digit iframe → Worker → D1, Digit GraphQL (token), and ShipStation V1 or V2. Cursor MCPs
are design-time only.

```
Cursor: Digit MCP (schema, permissions, publish)
        ShipStation docs MCP (endpoint docs — not live API calls)

Published app:
  Frontend (src/frontend)  --/proxy/digit-->  Digit GraphQL (viewing user)
                           --/proxy/backend--> Worker
  Worker (src/backend)     --D1-->  SHIPSTATION_DB
                           --HTTPS--> https://api.shipstation.com (V2 ssFetch)
                           --HTTPS--> https://ssapi.shipstation.com (V1 ssFetch)
                           --HTTPS--> Digit GraphQL (JWT_TOKEN)
  After SS writeback               -->  runAfterDigitShipped (Rutter or direct channel adapters)
  Schedule poll-outbound-push (300s) -->  push eligible Digit shipments (if scheduled); poll unlabeled maps
```

## Secrets and bindings (names only)

| Name | Kind | Role |
| --- | --- | --- |
| `SHIPSTATION_DB` | D1 binding | Publish-time only. Not shown in the setup UI. |
| `SHIPSTATION_API_KEY` | Digit app secret | ShipStation key. Alone = V2; with secret = V1. Validated on connect. |
| `SHIPSTATION_API_SECRET` | Digit app secret | Optional. When set with the key, connect uses V1 Basic auth. |
| `JWT_TOKEN` | Digit app secret | Clerk JWT for Worker GraphQL (poll writeback + scheduled push). Digit staff generate this token and place it on the account. |
| `FAIRE_API_KEY` | optional secret | Faire adapter after Digit ship writeback. |
| `SHOPIFY_*`, `WOOCOMMERCE_*` | optional secrets | Channel adapters — see `CHANNEL_SECRETS` in `runtimeConfig.js`. |

**Credential rule:** key alone → V2; key + secret → V1. Mode is stored as
`shipstation_connection.api_version`. Switching requires disconnect and reconnect.
`liveCredentials` in `sync.js` returns null (with a reconnect message) if current
secrets no longer match that stored version.

App secrets are **organization-level**, so a published template serves many organizations
without sharing any credential. All of them are managed in Digit's App Secrets UI and reach
the Worker as `env.KEY` — never pasted into the app. Digit GraphQL is always
`https://api.digit-software.com/graphql`. Do not name secrets with a `DIGIT_` prefix.

The generated `ENCRYPTION_KEY` row in D1 exists only to decrypt legacy pasted **V2** keys
(`shipstation_connection.api_key_encrypted`). New connection rows store `''`. Core setup
secrets are read from Digit-injected `env` only (migration `0007` drops legacy
`app_config` secret rows so removing a Digit secret cannot leave a ghost “1 of 3”).

`GET /setup` is read-only and reports what the Worker can see, including
`items[].source` (`appSecret` when injected; core setup secrets no longer use
`appDatabase`) and `shipStationApiMode` (`v1` | `v2` | `missing`). Partial config never
blocks the app — the UI degrades feature by feature instead.

## Files to edit

| File | Role |
| --- | --- |
| `src/backend/shipstationFetch.js` | Shared `ssFetch` (V1 Basic / V2 api-key, SSRF allowlist). |
| `src/backend/shipstation.js` | Facade: dispatch helpers on `credentials.apiVersion`. |
| `src/backend/digitGraphql.js` | Worker Digit GraphQL client. |
| `src/backend/sync.js` | Push, writeback, D1 map (`liveCredentials`). Sets the shipment carrier after label purchase / fulfillment writeback. |
| `src/backend/matchDigitCarrier.js` | Map SS `carrier_code` / friendly name to Digit shipping-carrier options (manual map, aliases, conservative fuzzy). |
| `src/backend/activity.js` | `appendActivity` / `listActivity` (no secrets or PII). |
| `src/backend/eligibility.js` | Packed / already-pushed / import gates for Digit shipments. |
| `src/backend/mappers/packageMapping.js` | Digit measurements/container ids → V2 packages or V1 order-level package fields. |
| `src/backend/mappers/digitToShipStation.js` | Digit shipment → V2; aggregates split order lines and emits one package per pack container. |
| `src/backend/mappers/digitToShipStationV1.js` | Single-container Digit shipment → V1 order (`POST /orders/createorder`). |
| `src/backend/mappers/normalizeSsRecord.js` | V1 order / V2 shipment → shared fulfillment shape. |
| `src/backend/mappers/shipStationToDigit.js` | Normalized SS record → Digit company/order (clone recipe; not used in Phase 1 UI). |
| `src/backend/channels/` | Adapter registry, D1 store helpers, platform stubs (outbound). |
| `src/backend/http/platformFetch.js` | Generic commerce HTTP client. |
| `src/backend/handleChannels.js` | `GET /channels/status`. |
| `src/backend/connection.js` | Connect/disconnect, org settings, carriers. |
| `src/backend/labels.js` | Label download helpers. |
| `src/backend/handleSync.js` | `/sync/shipments`, `/sync/push`, `/sync/label`, `/sync/activity`, `/sync/poll`. |
| `src/backend/jobs.js` | `poll-outbound-push`. |
| `src/backend/runtimeConfig.js` | Digit-injected app secrets (`env`); `ENCRYPTION_KEY` in D1. |
| `src/backend/setup.js` | `GET /setup` status only (no writes). |
| `src/backend/migrations/*.sql` | New files only after `0001_init.sql` has been published. |
| `src/frontend/App.tsx` | Connect + Phase 1 settings. |
| `src/frontend/SetupNeeded.tsx` | Reports missing app-secret keys and directs owners to Digit's App Secrets UI. |
| `src/frontend/FeatureStatus.tsx` | Per-feature Working / Limited / Not yet and what each needs. |
| `src/frontend/FulfillmentQueue.tsx` | Paginated shipping queue; status filter follows SS `tracking_status` mapped to Digit shipping statuses. |
| `src/frontend/ActivityLog.tsx` | D1 activity events. |
| `src/frontend/eligibility.ts` | Keep in sync with `eligibility.js`. |
| `manifest.json` | Permissions, D1, schedule. |

## Constraints the UI does not enforce

- The Worker does not receive the viewing user. Treat `/proxy/backend` as callable by anyone who can open the app.
- `JWT_TOKEN` is the Worker’s Digit identity (staff-generated Clerk JWT). A `da_` API token cannot update shipments.

Error handling and the activity log: [error-handling.md](error-handling.md).
