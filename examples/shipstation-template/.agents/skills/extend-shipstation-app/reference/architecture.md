# Architecture

Digit iframe → Worker → D1 and ShipStation V2. Cursor MCPs are design-time only.

```
Cursor: Digit MCP (schema, permissions, publish)
        ShipStation docs MCP (endpoint docs — not live API calls)

Published app:
  Frontend (src/frontend)  --/proxy/digit-->  Digit GraphQL
                           --/proxy/backend--> Worker
  Worker (src/backend)     --D1-->  SHIPSTATION_DB
                           --HTTPS--> https://api.shipstation.com (ssFetch)
  Public POST /webhooks/shipstation  -->  shipstationWebhook
```

## Secrets and bindings (names only)

| Name | Kind | Role |
| --- | --- | --- |
| `SHIPSTATION_DB` | D1 binding | Connection, carriers, services, webhook ids, org settings, label audit stub |
| `APP_SECRET_ENCRYPTION_KEY` | secret | Base64 32-byte AES key. Encrypts the ShipStation API key in D1. Never returned to the UI. |
| `PUBLIC_WEBHOOK_URL` | optional env | This app’s public `/webhooks/shipstation` URL. When set, connect registers ShipStation webhooks; disconnect deletes them. |

Configure these on the Digit app (Secrets / env). Missing required config is reported by `GET /setup` (setup screen), not as a generic 502.

## Files to edit

Paths relative to `examples/shipstation-template` or `apps/<name>` after
`npm run new-app -- <name> --from shipstation-template`.

| File | Role |
| --- | --- |
| `src/backend/shipstation.js` | Only place that talks to ShipStation. Extend `ssFetch` helpers here. |
| `src/backend/connection.js` | `/connection`, `/carriers`, `/org-settings`; encrypt/decrypt; register/deregister webhooks; carrier sync |
| `src/backend/webhooks.js` | Inbound `shipstation` handler (stub today: HTTP 200) |
| `src/backend/setup.js` | `GET /setup` — which env/bindings exist |
| `src/backend/crypto.js` | AES-256-GCM; digit-api `appConfigVars` wire format |
| `src/backend/index.js` | `createHandler({ webhooks, fetch })` — add jobs here if you enqueue work |
| `src/backend/migrations/*.sql` | New files only after `0001_init.sql` has been published |
| `src/frontend/App.tsx` | Connect / settings UI |
| `src/frontend/SetupNeeded.tsx` | First-load missing-config screen |
| `manifest.json` | Permissions, D1 binding, `backend.webhooks` |

## Constraints the UI does not enforce

- The Worker does not receive the viewing user. Treat `/proxy/backend` as callable by anyone who can open the app.
- `manifest.permissions` is `[]` today: Digit calls are ungated fields (`currentPermissions`, `organization`). Any new Digit write needs `appPermissions` keys in the manifest.
