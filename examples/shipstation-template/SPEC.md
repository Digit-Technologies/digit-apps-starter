# ShipStation template

## What it does

Org-admin Digit app for connecting exactly one ShipStation V2 account per organization. Admins
paste an API key; the Worker validates it with `GET /v2/carriers` before encrypting (AES-256-GCM,
digit-api `appConfigVars` wire format) and storing it in D1. Settings that control ShipStation
behavior live on `shipstation_connection`; the org default fulfillment method lives in
`org_settings` because Digit `moduleSettings.shipping` has no such field yet. Disconnect
soft-deletes the connection, carriers, and services, deregisters webhooks, and leaves
`shipment_label` rows for audit. Reconnect inserts a new connection and re-syncs carriers.

This example is source for `npm run new-app -- my-app --from shipstation-template`. It is not a
live Digit publish in this repo. Local `npm run pack` has no Worker/D1/secrets — connect only
works after a consumer publishes to Digit.

## Data & permissions

- `manifest.permissions`: `["UPDATE_ORGANIZATION"]`. Digit GraphQL used:
  `currentPermissions { key }` (org-admin gate: `UPDATE_ORGANIZATION`) and
  `organization { id }`. Neither field requires a permission to *call*, but
  `currentPermissions` returns the app token's permissions — the intersection of this
  manifest with the viewing user's live set. With `[]` it returned an empty list, so the
  admin gate failed for org admins too. Declaring the key does not grant it: non-admins
  still intersect to `[]` and keep the read-only screen. The app never calls
  `updateOrganization`; the key exists only so the gate can read it back.
- D1 `SHIPSTATION_DB` — schema in `src/backend/migrations/`. Applied on consumer publish.
- Secret `APP_SECRET_ENCRYPTION_KEY` — base64 32-byte AES key. Consumer sets this on the Digit
  app. Never returned to the UI. Missing key → `MISSING_CONFIG` on connect/disconnect.
  **Never commit this value, a ShipStation API key, or `.env` files** — this example is public
  source. Docs may name the secret; they must not contain a real key.
- Optional env `PUBLIC_WEBHOOK_URL` — this app’s public `/webhooks/shipstation` URL. When set,
  connect registers ShipStation `label_created_v2` and `track` webhooks; disconnect DELETEs them.
- First load `GET /setup` (no `requireEnv`) reports which of those keys plus `SHIPSTATION_DB`
  are present/valid. Missing required config is a dedicated setup screen, not a connect-time
  `MISSING_CONFIG` alert. Optional `PUBLIC_WEBHOOK_URL` is listed but does not block.
- **Gotcha:** Org-admin is UI-only. The Worker does not receive the viewing user; anyone who
  can open a published copy can hit `/proxy/backend`.
- **Gotcha:** `api_key_encrypted` is never selected into JSON. Invalid keys fail the wizard
  with a ShipStation-specific message, not a generic 502.
- MVP one-connection guard: partial unique index on `organization_id` where `deleted = 0`.
## Prompts

```
for the shipstation template work out a plan to build a first pass at a template starter app
that a user can connect to their shipstation account. Here are the first round of functional
requirements:

 FR-1 Org admin can connect exactly one ShipStation account per org (MVP) by entering an API
 key; stored in shipstation_connection, encrypted AES-256-GCM per the digit-api
 appConfigVars pattern. Plaintext keys are never persisted or returned by any API. Table is
 multi-account-ready; the MVP one-connection guard is a partial unique index
 (organization_id) where deleted = false, dropped when multi-account ships.

FR-2 Connect validates the key with a live ShipStation call (GET /v2/carriers) before
saving; invalid key fails the wizard with an actionable error.
FR-3 Org settings: rate-shop timing (order_creation | shipping), rate mode (rate_shop |
best_rate | strict_default), best-rate strategy, default carrier/service, default package
weight/dims fallbacks, "Add label cost to SO shipping_fees" (per-SO overridable),
"Auto-send return-label email" (default off), address-validation enforcement
(warn-override allowed). shipstation_connection columns (rate_timing, rate_mode,
best_rate_strategy, add_cost_to_shipping_fees, auto_send_return_email,
block_on_invalid_address, defaults) are authoritative for all ShipStation behavior settings
and are what the settings modal (AC-23) edits; moduleSettings.shipping holds only the
non-connection org default (default fulfillment method).
FR-4 Disconnect soft-deletes the connection and soft-deletes its
shipstation_carrier/shipstation_service rows, disables all ShipStation actions, and
deregisters webhooks; existing shipment_label rows remain readable and keep their FKs to
the soft-deleted carrier rows for audit. Reconnect creates a fresh connection row and
triggers a full carrier re-sync.
```

```
now I've set up the digit mcp. Write the plan with this in mind
```

```
I am not going to push the app through the mcp. I am going to create a template like the
others in the example folder and push up to github. Does that affect the plan at all?
```

```
Implement the plan as specified
```

```
Add error handling to shipstation template on first load. Show a screen indicating the secrets and env variables that need to be added for the app to work
```

```
For the shipstation template: add tooltips explaining what each setting does in the attached modal.
```

## Context supplied

- Example lives in `examples/shipstation-template` (started as hello-world skeleton, then
  Worker + D1 like timecard).
- Digit MCP confirmed no `shipstation*` GraphQL types; `OrganizationShippingSettings` is only
  `preventOverPicking`. Default fulfillment method is therefore D1 `org_settings`, not
  `updateOrganization`.
- Delivery is git source, not MCP `publishApp`. Consumers: create an app in Digit, set
  `APP_SECRET_ENCRYPTION_KEY`, pack, publish in the Digit UI.
- Out of scope this pass: buying labels, rate shopping, writing SO `shipping_fees`, sending
  return-label email, enforcing address validation beyond storing the flag, inbound webhook
  business logic beyond HTTP 200.
- Settings-modal screenshot (dark theme) was used as the field map for AC-23 tooltips:
  default fulfillment method, rate-shop timing, rate mode, best-rate strategy, default
  carrier/service, fallback weight/dims, add label cost, auto-send return-label email.
  Block-on-invalid-address is in the same modal and got the same info-icon treatment.
- Digit `MuiTooltip` is overline/uppercase with a short max-width. Settings hints override
  that via `slotProps` so explanations stay sentence case and wrap. Hover-on-control
  tooltips were not discoverable next to Selects; hints sit on an info icon instead.
