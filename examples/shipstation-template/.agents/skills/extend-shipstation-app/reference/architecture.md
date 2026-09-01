# Architecture

Digit iframe → Worker → D1, Digit GraphQL (token), and ShipStation V2. Cursor MCPs are design-time only.

```
Cursor: Digit MCP (schema, permissions, publish)
        ShipStation docs MCP (endpoint docs — not live API calls)

Published app:
  Frontend (src/frontend)  --/proxy/digit-->  Digit GraphQL (viewing user)
                           --/proxy/backend--> Worker
  Worker (src/backend)     --D1-->  SHIPSTATION_DB
                           --HTTPS--> https://api.shipstation.com (ssFetch)
                           --HTTPS--> Digit GraphQL (API_TOKEN_DIGIT)
  Public POST /webhooks/shipstation  -->  verify RSA-SHA256 → job process-ss-webhook
  Schedule poll-outbound-push (300s) -->  push eligible Digit SOs / inbound import
```

## Secrets and bindings (names only)

| Name | Kind | Role |
| --- | --- | --- |
| `SHIPSTATION_DB` | D1 binding | Publish-time only. Not shown in the setup UI. |
| `SHIPSTATION_API_KEY` | Digit app secret | ShipStation V2 key for this organization. Validated on connect. |
| `API_TOKEN_DIGIT` | Digit app secret | Digit API token for Worker GraphQL (webhooks + poll). |
| `PUBLIC_WEBHOOK_URL` | Digit app secret | Public `/webhooks/shipstation` URL. Connect registers SS webhooks. |
| `FAIRE_API_KEY` | optional secret | Turns on the Faire channel stub after Digit ship writeback. |

App secrets are **organization-level**, so a published template serves many organizations
without sharing any credential. All of them are managed in Digit's App Secrets UI and reach
the Worker as `env.KEY` — never pasted into the app. Digit GraphQL is always
`https://api.digit-software.com/graphql`. Do not name secrets with a `DIGIT_` prefix.

The generated `ENCRYPTION_KEY` row in D1 exists only to decrypt legacy pasted keys
(`shipstation_connection.api_key_encrypted`, `app_config`). New rows store `''`.

`GET /setup` is read-only and reports what the Worker can see, including
`items[].source` (`appSecret` for an injected secret, `appDatabase` for a legacy D1 row).
Partial config never blocks the app — the UI degrades feature by feature instead.

## Files to edit

| File | Role |
| --- | --- |
| `src/backend/shipstation.js` | Only place that talks to ShipStation (`ssFetch`). |
| `src/backend/digitGraphql.js` | Worker Digit GraphQL client. |
| `src/backend/sync.js` | Push, writeback, inbound import, D1 map. |
| `src/backend/activity.js` | `appendActivity` / `listActivity` (no secrets or PII). |
| `src/backend/eligibility.js` | Inventory / pack / lane / sync-mode gates. |
| `src/backend/mappers/digitToShipStation.js` | SO → SS shipment (`skuForLine`, bill-to notes). |
| `src/backend/mappers/shipStationToDigit.js` | SS shipment → Digit company/order. |
| `src/backend/channels/` | `afterDigitShipped`; Faire recipe. |
| `src/backend/connection.js` | Connect/disconnect, org Phase 1 settings, webhooks, carriers. |
| `src/backend/handleSync.js` | `/sync/orders`, `/sync/push`, `/sync/activity`. |
| `src/backend/webhooks.js` | Verify + enqueue. |
| `src/backend/jobs.js` | `process-ss-webhook`, `poll-outbound-push`. |
| `src/backend/runtimeConfig.js` | Injected app secrets first, legacy D1 `app_config` as fallback. |
| `src/backend/setup.js` | `GET /setup` status only (no writes). |
| `src/backend/migrations/*.sql` | New files only after `0001_init.sql` has been published. |
| `src/frontend/App.tsx` | Connect + Phase 1 settings. |
| `src/frontend/SetupNeeded.tsx` | Reports missing app-secret keys and directs owners to Digit's App Secrets UI. |
| `src/frontend/FeatureStatus.tsx` | Per-feature Working / Limited / Not yet and what each needs. |
| `src/frontend/FulfillmentQueue.tsx` | Paginated SO queue, push results, activity panel. |
| `src/frontend/ActivityLog.tsx` | D1 activity events. |
| `src/frontend/eligibility.ts` | Keep in sync with `eligibility.js`. |
| `manifest.json` | Permissions, D1, webhooks, schedule. |

## Constraints the UI does not enforce

- The Worker does not receive the viewing user. Treat `/proxy/backend` as callable by anyone who can open the app.
- `API_TOKEN_DIGIT` is the writeback identity; keep its scopes aligned with `manifest.permissions`.

Error handling and the activity log: [error-handling.md](error-handling.md).
