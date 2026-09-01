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
| `API_TOKEN_DIGIT` | pasted secret | Digit API token for Worker GraphQL (webhooks + poll). Stored in D1. |
| `PUBLIC_WEBHOOK_URL` | pasted config | Public `/webhooks/shipstation` URL. Connect registers SS webhooks. |
| `FAIRE_API_KEY` | optional secret | Turns on the Faire channel stub after Digit ship writeback. |

Digit GraphQL is always `https://api.digit-software.com/graphql`. An encryption key is
generated on first save and stored in D1 — operators never paste it. Do not name secrets
with a `DIGIT_` prefix.

`GET /setup` reports pasteable keys only. `POST /setup` saves them. Required items block connect.

## Files to edit

| File | Role |
| --- | --- |
| `src/backend/shipstation.js` | Only place that talks to ShipStation (`ssFetch`). |
| `src/backend/digitGraphql.js` | Worker Digit GraphQL client. |
| `src/backend/sync.js` | Push, writeback, inbound import, D1 map. |
| `src/backend/eligibility.js` | Inventory / pack / lane / sync-mode gates. |
| `src/backend/mappers/digitToShipStation.js` | SO → SS shipment (`skuForLine`, bill-to notes). |
| `src/backend/mappers/shipStationToDigit.js` | SS shipment → Digit company/order. |
| `src/backend/channels/` | `afterDigitShipped`; Faire recipe. |
| `src/backend/connection.js` | Connect/disconnect, org Phase 1 settings, webhooks, carriers. |
| `src/backend/handleSync.js` | `/sync/orders`, `/sync/push`. |
| `src/backend/webhooks.js` | Verify + enqueue. |
| `src/backend/jobs.js` | `process-ss-webhook`, `poll-outbound-push`. |
| `src/backend/runtimeConfig.js` | D1 `app_config` + optional env overrides. |
| `src/backend/setup.js` | `GET`/`POST /setup` (pasteable keys only). |
| `src/backend/migrations/*.sql` | New files only after `0001_init.sql` has been published. |
| `src/frontend/App.tsx` | Connect + Phase 1 settings. |
| `src/frontend/FulfillmentQueue.tsx` | Paginated SO queue. |
| `manifest.json` | Permissions, D1, webhooks, schedule. |

## Constraints the UI does not enforce

- The Worker does not receive the viewing user. Treat `/proxy/backend` as callable by anyone who can open the app.
- `API_TOKEN_DIGIT` is the writeback identity; keep its scopes aligned with `manifest.permissions`.
