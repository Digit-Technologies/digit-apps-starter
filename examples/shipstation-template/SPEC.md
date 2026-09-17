# ShipStation template

## What it does

Phase 1 org Digit app: connect one ShipStation account (V2 key, or V1 key + secret), push Digit
shipments in **awaiting_carrier** into ShipStation as V2 shipments/`create_sales_order` or V1 orders.
**Scheduled push** (default) sends eligible shipments every five minutes; **Manual push** sends them
only when an operator clicks Refresh. Operators choose carrier and buy the label in ShipStation. The
same five-minute poll (and Refresh) pulls tracking, carrier, and cost back onto the Digit shipment.
The shipping queue lists awaiting-carrier Digit shipments and can be filtered by ShipStation tracking status
(`unknown` → Digit `awaiting_pickup`; `in_transit` / `delivered` / `error` → Digit `shipped`).
Operators can download
the PDF from the shipping queue once a label exists. Digit `shippingCarrierField` writeback
uses aliases + conservative fuzzy match on the **service** (not the brand), plus carrier-mapping
overrides (service map, then carrier default). Unmatched pulled
services stay unset, appear in a main-page alert, and can be mapped from the carrier chip
modal. Operators pick/pack and create the Digit
shipment first. Return labels, in-app rate shop, shipping-class mapping, and shipping-fee
capture stay out of the UI.

Source for `npm run new-app -- my-app --from shipstation-template`. Connect and sync only
work after a consumer publishes to Digit (Worker, D1, secrets).

## Data & permissions

- `manifest.permissions`: `UPDATE_ORGANIZATION` (admin gate via `currentPermissions`),
  `READ_ORDER` / `UPDATE_ORDER` / `CREATE_ORDER`,   `READ_SHIPMENT` / `CREATE_SHIPMENT` /
  `UPDATE_SHIPMENT`, `CREATE_PACK_CONTAINER` / `READ_PACK_CONTAINER`, `READ_PICKED_ITEM`,
  `READ_ITEM` / `READ_ITEM_COST_INFO`, `READ_INVENTORY`, `READ_COMPANY` /
  `READ_COMPANY_DETAILS` / `CREATE_COMPANY`, `READ_CONTACT`, `READ_ORGANIZATION_LOCATION`,
  `READ_ORGANIZATION_DYNAMIC_FIELD`.
  Keys from MCP `appPermissions`. The Worker uses `JWT_TOKEN` (a Clerk user JWT) for the
  same operations on the 5-minute poll. **Digit staff generate this token and place it in
  the organization’s app secrets.** A Settings → API Tokens `da_` key is not sufficient
  (`apiPermissions` has no `UPDATE_SHIPMENT`).
- D1 `SHIPSTATION_DB` — publish binding only (not shown in the UI). `0001_init.sql` plus
  `0002_order_sync.sql`, `0003_app_config.sql`, `0004_activity_log.sql`,
  `0006_api_version.sql`, `0007_drop_legacy_app_secrets.sql`, `0008_shipment_map.sql`,
  `0009_label_rates.sql`, `0010_carrier_digit_map.sql`, `0011_tracking_status.sql`,
  `0012_push_mode.sql`, and `0013_carrier_service_map.sql`. Do not edit `0001` after a
  consumer has published.
- **All secrets are organization-level Digit app secrets**, managed only in Digit's built-in
  App Secrets UI: `SHIPSTATION_API_KEY`, `SHIPSTATION_API_SECRET` (V1),
  `JWT_TOKEN`. Key alone = V2; key + secret = V1.
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
  connection row (`api_version`) and syncs carriers.
  `api_key_encrypted` is written as `''` for new rows and only read as a
  **legacy V2 fallback** for keys pasted before this switch.
  The auto-generated `ENCRYPTION_KEY` row stays only to decrypt those legacy values.
- Disconnect soft-deletes local rows; removing the key itself is
  done in Digit.
- Digit GraphQL URL is always `https://api.digit-software.com/graphql`.
- Optional secret `FAIRE_API_KEY` — enables the Faire adapter stub (`src/backend/channels/faire.js`).
- `GET /setup` is read-only: per-item `present` / `source` / `enables` plus `ready`,
  `usable`, `apiTokenPresent`. `POST /setup` only returns a message
  pointing at Digit app secrets.
- Partial config is **not** a blocking screen. The app always renders; `FeatureStatus.tsx`
  shows per-feature Working / Limited / Not yet with what each one still needs, and the
  queue's push button is disabled with a reason when `JWT_TOKEN` is not live.
- Org settings: `default_fulfillment_method` is `scheduled` (5-minute outbound push) or
  `manual` (Refresh only). Default weight (ounces). Carrier maps live in a dedicated modal:
  one Digit `shippingCarriers` option per ShipStation **service**, with an optional
  per-carrier Digit default. Digit → ShipStation only.
- Schedule `poll-outbound-push` every 300s (outbound push when scheduled, plus unlabeled-map
  label pull). The shipping queue **Refresh** button always runs outbound push plus label pull
  via `POST /sync/poll`.
- **Tracking writeback uses `JWT_TOKEN`.** Digit staff generate a Clerk JWT and place it
  in the org’s app secrets. That identity has the user’s live permissions, including
  `UPDATE_SHIPMENT`. Settings → API Tokens (`da_`) cannot update shipments. Refresh still
  applies staged `pendingWritebacks[]` in the iframe as a fallback when the operator is
  present.
- **Rate limits:** the poll lists Digit shipments (`awaiting_carrier`) with `SHIPMENT_LIST_QUERY` and hands each node to
  `pushShipment` as `preloaded`, so ineligible shipments cost no extra Digit query, and a run stops
  after `MAX_PUSHES_PER_RUN` (25). `digitGraphql` retries a 429 twice with backoff (honoring
  `Retry-After`) and then returns "Digit API rate limit reached". Keep per-order Digit calls
  out of any loop you add here — that is what caused "Too many requests" before.
- **Gotcha:** Org-admin is UI-only. Anyone who can open the app can hit `/proxy/backend`.
- **Gotcha:** `0001` still has unused rate/label-cost columns. Do not expose them in GET/PATCH
  JSON until a Phase 2 recipe re-adds that UI.

## Prompts

```
Make the following updates:
- Remove leftover secrets (PUBLIC_WEBHOOK_URL, SHIPSTATION_WEBHOOK_TOKEN)
- Ensure that all webhook related functionality is removed from the application
- In org settings
  - Update default fulfillment method to have two options:
    - Scheduled push: Use shipstation api to push from shipment queue every 5 mins
    - Manual push: only push to shipstation on refresh button click
  - Remove Sync mode completely: only offer Digit to Shipstation workflow
  - Remove any settings that are not currently used by the app like Push and Lane tag ID
  - Remove default package dimensions
```

```
Refactor the ShipStation app so push only creates the shipment/order, operators pick rates
in ShipStation, and tracking/price come back via 5-minute API poll plus an on-demand
Refresh. Remove auto rate-shop and auto-buy labels for V1 and V2. Do not subscribe
ShipStation webhooks on connect.
```

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

```
Refactor the app so that the queue pulls data from the Shipments table in digit
```

```
make sure to use the /frontend-design /create-digit-app skills when forging this plan
```

```
Shipping Queue from Digit Shipments

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.
```

```
build out app so that when a shipment is sent to shipstation the shipping lable is returned and downloadable from the download icon in the shipping queue
```

```
{
  "mcpServers": {
    "shipstation-docs": {
      "url": "https://docs.shipstation.com/mcp"
    }
  }
}
```

```
ShipStation label purchase and queue download

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.
```

```
does the app reset the digit shipping order with the correct carrier information from shipstation?
```

```
write a plan to update the carrier to what is returned by shipstation. there may need to be some fuzzy matching involved
```

```
Digit carrier writeback from ShipStation

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.
```

```
Investigate why clicking the 'Download packing slip' icon button results in an error: failed to fetch
```

```
I can't run this locally I have to run through the Digit platform. Maybe we can build a button into the app for testing purposes that allows me to download the log and then I could provide attach it to this chat
```

```
Have the shipstation template app show shipped shipments in the queue. Allow the user to filter by status
```

```
match the digit shipment statuses to what the shipstation api returns as `Tracking status`
```

```
the fulfillment queue should show the digit shipment status and the shipstation tracking status (column labeled Tracking status)
```

```
Container-Aware ShipStation Refactor

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.
```

## Context supplied

- Work stays on git branch `shipstation-template` tracking `fork/shipstation-template`
  (`loren-wolfe/digit-apps-starter`). Do not push to upstream `origin` unless asked.
- Phase 1: COM-01–COM-08 plus CS-12/13/14/16 and CS-01 as a Faire recipe/stub.
- Strip FR-3 return-email, address-block, and shipping-fee capture from UI and Worker JSON.
  Leave unused `0001` connection columns at SQL defaults. Default package weight lives on
  `org_settings` (`0009_label_rates.sql`). Do not auto rate-shop or buy labels from Digit.
- Digit native pick/pack/PDF; operators create a Digit shipment (`awaiting_carrier`). The shipping
  queue lists awaiting-carrier, unknown (`awaiting_pickup`), and in-transit/delivered (`shipped`)
  Digit shipments (filter by mapped ShipStation `tracking_status`). Worker push is V2
  `POST /v2/shipments` with `create_sales_order: true`, or V1 `POST /orders/createorder`.
  Operators buy labels in ShipStation. Poll/`POST /sync/poll` uses `GET /v2/labels` (V2) or
  `GET /orders/{id}` (V1) then Digit writeback. Shipping-label download uses `POST /sync/label`;
  packing-slip download uses `POST /sync/packing-slip`, where the Worker calls
  `generateSalesOrderPdf`, fetches the presigned PDF URL outside the iframe CSP, and returns
  base64. Both finish with `DigitHost.download`. This app does not register or receive
  ShipStation webhooks. Digit `shippingCarrierFieldId` is set from the ShipStation service on
  writeback (service map, then carrier default, then service-string auto-match). Pulled labels
  whose service still does not resolve show a warning on the main page.
- `JWT_TOKEN` because the scheduled poll has no iframe Digit session. Digit staff generate
  this Clerk JWT and place it in the organization’s app secrets. Do not use `da_` API tokens.

```
why am I getting this error in the app:
"Writing ShipStation label se-200223533 back to Digit failed: [NOT_AUTHORIZED] User is not
authorized to access updateShipment on Mutation"
```

- Cause: `apiPermissions` (API-token scopes) offers `READ_SHIPMENT` but no `UPDATE_SHIPMENT` /
  `CREATE_SHIPMENT`, while `appPermissions` has all three. The Worker writeback used the token,
  so it could never succeed. Fix: poll stages the label as `label_ready` + `pendingWritebacks[]`,
  the frontend runs `updateShipment` on the operator's session, then `POST
  /sync/writeback-complete`.

```
Change the api token secret to JWT_TOKEN and make a note that Digit staff will have to
generate this token and place it in the account for the user
```

- Rename `API_TOKEN_DIGIT` → `JWT_TOKEN`. Digit staff generate a Clerk JWT and store it as
  that org app secret. Do not use Settings → API Tokens (`da_`).

```
Pull in carrier information in the following ways.
- Use carrier chip on the main page as a button click to pop up a carrier settings modal.
- Put carrier mapping in that modal. Rework the UI to make it more clear which Shipstation carriers are being matched.
- Show alert if there is a carrier being pulled in that doesn't match.
```

- Carrier count in the command bar is a chip that opens a dedicated mapping modal (org admins).
  Each ShipStation carrier shows name, code, Digit match, and Auto/Manual/Unmatched. Pulled
  label carriers that still do not resolve are listed separately, warned on the main page, and
  omitted from `unmappedCarriers` once they match or are mapped. Fulfillment method and default
  weight stay in Settings. Creating Digit carrier options is out of scope.

```
testing shows that there are two unmatched but no alert to the user. Show a little red alert
icon on the chip to let users know mapping is needed.
```

- The alert counted only `unmappedCarriers` (carriers seen on a purchased label), so synced
  carriers with no Digit match showed Unmatched in the modal with no page alert. The chip and
  alert now key off every `ssCarriers[]` row without a `digitOptionId`; the chip turns red with
  an error icon and tooltip. A carrier already used on a label escalates the alert to `error`
  ("those shipments have no Digit carrier"); otherwise it is a `warning`. When
  `digitCarriersError` is set, unmatched state is suppressed (nothing can match) and the load
  error itself is shown on the page.

```
Make the carrier mapping UI tighter. Consider a more table like format
```

- The modal is a dense MUI `Table` (ShipStation / Digit shipping carrier / Match) instead of
  stacked cards, with a `mapped of total` count. Rows sort unmatched-first by server state so
  they do not jump while editing. Catalog and label-only carriers share one table; label-only
  rows are tagged `from label` under the code. `TablePagination` appears past 10 rows.

```
The carrier matching feature needs to take into account that Digit considers different services offered by a carrier as unique carriers.

The following describes how shipstation handles this:
Shipping service (ground, air, express, etc.) is selected via the service_code field on your shipment.

Every carrier has its own set of service codes. You set one service_code per shipment, and it determines the speed, price, and handling. Common examples:

UPS

ups_ground — standard ground delivery
ups_2nd_day_air — 2-day air
ups_next_day_air — overnight
ups_next_day_air_saver — overnight, cheaper cutoff
ups_worldwide_express — international express
FedEx

fedex_ground — standard ground
fedex_home_delivery — residential ground
fedex_2day — 2-day air
fedex_priority_overnight — next day by 10:30am
fedex_standard_overnight — next day by 3pm
fedex_international_priority — international express
USPS (via Stamps.com)

usps_priority_mail — 1–3 days
usps_priority_mail_express — overnight/2-day
usps_ground_advantage — standard ground/parcel

 Outline how to reconcile this in the carrier config modal
```

- Mapping grain is ShipStation **service** (`service_code`) → Digit `shippingCarriers`.
  Resolution: manual service map, then manual carrier default, then auto-match on the
  service name/code with a brand gate (never `stamps_com` → `USPS`). The modal filters by
  ShipStation carrier, has a Default Digit carrier control, and a service table. Chip/alert
  count unmatched services. `carrier_digit_map` unique is
  `(connection_id, ss_carrier_code, ss_service_code)` (`0013`). Label pull stores
  `service_code` / `service_name` on the order map. Digit `shippingClass` is not written.
