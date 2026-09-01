# ShipStation template

## What it does

Phase 1 org Digit app: connect one ShipStation V2 account, push packed (or inventory-ready)
Digit sales orders into ShipStation as shipments/`create_sales_order`, and write tracking
back when ShipStation purchases a label. Operators pick/pack in Digit and print labels in
ShipStation. Rate shopping, label purchase in-app, return labels, and shipping-fee capture
are Phase 2 — those controls are not in the UI.

Source for `npm run new-app -- my-app --from shipstation-template`. Connect and sync only
work after a consumer publishes to Digit (Worker, D1, secrets).

## Data & permissions

- `manifest.permissions`: `UPDATE_ORGANIZATION` (admin gate via `currentPermissions`),
  `READ_ORDER` / `UPDATE_ORDER` / `CREATE_ORDER`, `READ_SHIPMENT` / `CREATE_SHIPMENT` /
  `UPDATE_SHIPMENT`, `CREATE_PACK_CONTAINER`, `READ_ITEM`, `READ_INVENTORY`, `READ_COMPANY` /
  `READ_COMPANY_DETAILS` / `CREATE_COMPANY`, `READ_CONTACT`, `READ_ORGANIZATION_LOCATION`.
  Keys from MCP `appPermissions`. The Worker uses `API_TOKEN_DIGIT` for the same operations
  on webhooks and the 5-minute poll — grant the token those permissions too.
- D1 `SHIPSTATION_DB` — publish binding only (not shown in the UI). `0001_init.sql` plus
  `0002_order_sync.sql` and `0003_app_config.sql`. Do not edit `0001` after a consumer has published.
- Operators paste `API_TOKEN_DIGIT` and `PUBLIC_WEBHOOK_URL` on the setup screen; they are
  stored in D1 (`app_config`). An encryption key is generated automatically (not shown).
  Do not use a `DIGIT_` prefix — Digit reserves it for platform bindings.
- Digit GraphQL URL is always `https://api.digit-software.com/graphql`.
- Optional secret `FAIRE_API_KEY` — enables the Faire adapter stub (`src/backend/channels/faire.js`).
- `GET /setup` lists pasteable config. Missing required config is a setup screen.
- `POST /setup` saves pasted values (omit a field to keep what is already stored).
- Schedule `poll-outbound-push` every 300s (also runs inbound import when sync mode is
  `ss_to_digit`).
- **Gotcha:** Org-admin is UI-only. Anyone who can open the app can hit `/proxy/backend`.
- **Gotcha:** `0001` still has unused rate/label-cost columns. Do not expose them in GET/PATCH
  JSON until a Phase 2 recipe re-adds that UI.

## Prompts

```
Write a plan to take the template app through phase 1 outlined in the markdown pasted
below. Even though the other phases are out of scope, engineer the app with them in mind.
Ideally the app will meet the common needs of customers out of the box but be easily
extendable when pulled into their own llms.
```

```
the plan looks mostly good. But update the template to remove settings that are for phase
two or three. The app ui and usage flow should only meet phase 1 needs.
```

```
also make sure changes to to my forked repository branch called shipstation-template
```

```
Implement the plan as specified, it is attached for your reference. Do NOT edit the plan
file itself.
```

## Context supplied

- Work stays on git branch `shipstation-template` tracking `fork/shipstation-template`
  (`loren-wolfe/digit-apps-starter`). Do not push to upstream `origin` unless asked.
- Phase 1: COM-01–COM-08 plus CS-12/13/14/16 and CS-01 as a Faire recipe/stub.
- Strip FR-3 rate-shop, carrier defaults, dims, label-cost, return-email, and address-block
  settings from UI and Worker JSON. Leave `0001` columns at SQL defaults.
- Digit native pick/pack/PDF; ShipStation native labels. Worker `POST /v2/shipments` with
  `create_sales_order: true`. Webhooks: RSA-SHA256 JWKS verify, then jobs.
- `API_TOKEN_DIGIT` because webhooks have no iframe Digit session.
