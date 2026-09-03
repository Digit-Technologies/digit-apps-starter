# ShipStation template

## What it does

Phase 1 org Digit app: connect one ShipStation account (V2 key, or V1 key + secret), push packed (or inventory-ready)
Digit sales orders into ShipStation as V2 shipments/`create_sales_order` or V1 orders, and write tracking
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
  `0002_order_sync.sql`, `0003_app_config.sql`, `0004_activity_log.sql`,
  `0006_api_version.sql`, and `0007_drop_legacy_app_secrets.sql`. Do not edit `0001` after
  a consumer has published.
- **All secrets are organization-level Digit app secrets**, managed only in Digit's built-in
  App Secrets UI: `SHIPSTATION_API_KEY`, `SHIPSTATION_API_SECRET` (V1),
  `SHIPSTATION_WEBHOOK_TOKEN` (V1 webhooks), `API_TOKEN_DIGIT`, `PUBLIC_WEBHOOK_URL`.
  Key alone = V2; key + secret = V1. V1 + `PUBLIC_WEBHOOK_URL` requires the webhook token.
  The app never accepts, writes, returns, or logs their values. Digit injects them into the
  Worker as `env.KEY`. There is **no D1 fallback** for these keys (legacy `app_config` rows
  are deleted on publish via `0007`) so removing a secret in Digit drops setup progress to
  match. The published app is a template for many organizations, so **no secret is ever
  shared across organizations**. Do not use a `DIGIT_` prefix — Digit reserves it for
  platform bindings.
- `GET /setup` reports `items[].source` (`appSecret` when live) plus `shipStationApiMode`
  (`v1` | `v2` | `missing`). Setup progress counts **required** items only.
- `POST /connection` no longer takes a key: it reads `SHIPSTATION_API_KEY` (and
  `SHIPSTATION_API_SECRET` for V1), validates with a live carrier list, then creates the local
  connection row (`api_version`), syncs carriers, and registers webhooks.
  `api_key_encrypted` is written as `''` for new rows and only read as a
  **legacy V2 fallback** for keys pasted before this switch.
  The auto-generated `ENCRYPTION_KEY` row stays only to decrypt those legacy values.
- Disconnect deregisters webhooks and soft-deletes local rows; removing the key itself is
  done in Digit.
- Digit GraphQL URL is always `https://api.digit-software.com/graphql`.
- Optional secret `FAIRE_API_KEY` — enables the Faire adapter stub (`src/backend/channels/faire.js`).
- `GET /setup` is read-only: per-item `present` / `source` / `enables` plus `ready`,
  `usable`, `apiTokenPresent`, `webhookUrlPresent`. `POST /setup` only returns a message
  pointing at Digit app secrets.
- Partial config is **not** a blocking screen. The app always renders; `FeatureStatus.tsx`
  shows per-feature Working / Limited / Not yet with what each one still needs, and the
  queue's push button is disabled with a reason when the Digit token is not live.
- Schedule `poll-outbound-push` every 300s (also runs inbound import when sync mode is
  `ss_to_digit`).
- **Rate limits:** the poll lists orders with `ORDER_DETAIL_QUERY` and hands each node to
  `pushOrder` as `preloaded`, so ineligible orders cost no extra Digit query, and a run stops
  after `MAX_PUSHES_PER_RUN` (25). `digitGraphql` retries a 429 twice with backoff (honoring
  `Retry-After`) and then returns "Digit API rate limit reached". Keep per-order Digit calls
  out of any loop you add here — that is what caused "Too many requests" before.
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

```
I am unable to enter the api token without also entering the webhook url. I want to be
able to set this up one token at a time.
```

```
Allow user to run the app with just the tokens that have been provided. Make it clear
which functionlity is working.
```

```
why doesn't this app use the shipstation api key? Or is that what is saved as
APP_SECRET_ENCRYPTION_KEY
```

```
Can we programatically add the tokens the the digit app secrets?
```

```
Use the built in digit infrastructure to save tokens rather than the textbox input.
```

```
There is a misunderstanding of how the digit infrastructure works. All Secrets are at the
organization level not the published app. Which is what I want. No secrets should be shared
across the published app. The published app is a template meant to serve many organizations.
Store the shipstation app in the same way that the digit api token and the public webhook
url are stored
```

```
GraphQL error
Too many requests, please try again later.

Support info
```

```
Change the copy in the informational from "These are this organization’s app secrets in
Digit. Add the missing values under Digit → Apps → this app → Secrets, then reload. Values
are managed by Digit and are never entered or shown inside this app." to "These are this
organization’s app secrets in Digit. Add the missing values by clicking 'Manage Custom
Apps' and then 'Edit' for the ShipStation integration, then reload. Values are managed by
Digit and are never entered or shown inside this app."
```

```
In the shipstation template consider error handling. Write out a plan to handle errors and
make troubleshooting easier. For example, I clicked "push selected" and the item I had
selected disappeared. The user needs a way to see a log of what actions have been taken
and an indication that the action went through successfully and waht that means. Make
error handling robust and verbose.
```

```
add information about error handling to the shipstation extention skill as well
```

```
Implement the plan as specified, it is attached for your reference. Do NOT edit the plan
file itself.
```

```
Make SOs in fulfillment queue links
```

```
Ready and status columns appear to be duplicates
```

```
make the selection column frozen
```

```
rename shipstation column to shipstation id
```

```
publish
```

```
rename push column to status
```

```
republish
```

```
Use the /frontend-design skill to redsign the app while still following the conventions laid out in this repo
```

```
ShipStation App UI Redesign

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.
```

```
Move the Finish Setup and What You Can Do section to a separate page or modal
```

```
make faild chip color different than missing
```

```
The chip is way too big and the red is too bright
```

```
app flashes and then disappears. This error is in the console
js?id=AW-16540468916:848 Cross-Origin-Opener-Policy policy would block the window.postMessage call.
...
ReferenceError: motionFadeIn is not defined
```

```
write a plan to refactor the app to accept both v2 and v1 shipstation api keys
```

```
Use option A for question 1 and option A for question 2
```

```
Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.
```

```
even when I remove the shipstation api key the app shows that the set up is still "1 of 3"
when it should be "0 of 3"
```

```
seperate v1 and v2 capabilities so that it is clear that the user will get either v1 OR v2
but not both.
```

```
when I reload the app and remove the secrets it still shows "1 out of 3" and now it shows
the whole fulfillment queue as well.
```

```
why is it still showing that shipstation is live when on the connect shipstation page?

I'm getting this error when I try to connect: This organization already has a ShipStation
account connected. Disconnect it first to reconnect.
```

```
This still didn't fix the issue. I removed all shipstation api keys and the chip and modal
are still saying the app is connected to shipstation
```

```
It's still not working. When I try to connect to shipstation it doesn't raise an error
indicating that thre is no shipstation api key present
```

```
still not working
```

```
on a new branch called - ui-fixes write a plan to complete the following tasks:
- ensure that text is visible on both dark and light mode
- remove duplicate text from fulfillment log re: digit api key
- In settings modal under "What you can do" remove duplicate shipstation v1 and v2 entries.
- In settings modal under Finish Setup instead of splitting V1 an V2 shipstation token info, use a toggle to toggle between the two.
```

```
UI fixes (dark/light, duplicates, V1/V2 toggle)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.
```

## Context supplied

- Work stays on git branch `shipstation-template` tracking `fork/shipstation-template`
  (`loren-wolfe/digit-apps-starter`). Do not push to upstream `origin` unless asked.
- Phase 1: COM-01–COM-08 plus CS-12/13/14/16 and CS-01 as a Faire recipe/stub.
- Strip FR-3 rate-shop, carrier defaults, dims, label-cost, return-email, and address-block
  settings from UI and Worker JSON. Leave `0001` columns at SQL defaults.
- Digit native pick/pack/PDF; ShipStation native labels. Worker push is V2
  `POST /v2/shipments` with `create_sales_order: true`, or V1 `POST /orders/createorder`.
  Webhooks: V2 RSA-SHA256 JWKS verify, or V1 query token, then jobs.
- `API_TOKEN_DIGIT` because webhooks have no iframe Digit session.
