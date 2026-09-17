# Error handling and activity log

Operators must always see **what happened and what that means**. Agents extending this
app must keep that contract. Details live here; recipes and routes only cross-link.

## Immediate UI feedback

- Use in-page MUI `Alert` / `AppErrorAlert` / Dialog. Never `window.alert`.
- Every operator mutation (connect, save settings, disconnect, push, Refresh, packing-slip
  download, shipping-label download) must show **outcome + meaning** after the call returns.
- Do not clear selection, close a dialog, or wipe form state until the result is known.
  On a mixed `/sync/push` batch, uncheck only rows that were actually created in
  ShipStation; keep skipped and failed rows selected.
- Pair `useBackendQuery` / `useBackendMutation` / `useDigitApiQuery` errors with
  `AppErrorAlert`. Surface `DigitHost.download` throws the same way.

Example meaning for a successful push: the Digit shipment **stays awaiting carrier** until
the poll (or Refresh) finds a ShipStation label and writes tracking (`shipped`); the Worker
also sets Digit `shippingCarrierField` when the ShipStation service matches (or is mapped
in the carrier modal). Operators buy the label in ShipStation, then download the PDF from
the queue once it exists. Unmapped services log `carrier_unmapped`, leave Digit’s carrier
unset, and surface on the main page until they are mapped in carrier settings.

## HTTP 200 is not “all good”

`POST /sync/push` always returns Worker `{ ok: true, data: { results, summary } }` so a
mixed batch is not a single mutation error.

```js
{
  results: [{ shipmentId, orderId, ok, skipped, ssShipmentId, ssLabelId, message, meaning }],
  summary: { pushed, skipped, failed }
}
```

- `skipped: true` is eligibility (`ineligibilityReason`), not success. Show it.
- `ok: false` on a result is a ShipStation or Digit failure; keep that row selected.
- The UI must read `summary` and `meaning`. Do not treat hook `error === null` as
  “every shipment pushed.”

## Activity log

D1 table `activity_log` (migration `0004_activity_log.sql`). Helpers:
`appendActivity` / `listActivity` in `src/backend/activity.js`.

`GET /sync/activity?organizationId=` returns `{ events }` (newest first, max 100).

Record: `actor` (`user` | `schedule` | `channel`), `action`, ids, `status`
(`success` | `skipped` | `error`), human `message`, optional `detail` JSON (HTTP
status, `error_code`s, GraphQL `extensions.code`).

**Never** store API keys, `api_key_encrypted`, addresses, tracking numbers, or raw
payloads. Scheduled poll should not flood the log with routine eligibility
skips (those are user-visible on an explicit push).

New sync, connect, or poll paths must `appendActivity` and refetch
`/sync/activity` from the UI after operator actions.

## Verbose upstream errors

All ShipStation HTTP goes through `ssFetch`. On failure, parse the version-appropriate
body: V2 / ShipEngine `{ request_id, errors[].error_code, errors[].message, errors[].field_name }`;
V1 often `{ Message }` / `{ message }`. Confirm the shape on ShipStation docs MCP before
changing parsers. Do **not** include `field_value` (may be PII) or request bodies.

Digit Worker GraphQL (`digitGraphql.js`): include `errors[0].message` and
`extensions.code` when present.

Keep `last_error` / activity `message` truncated (~500 chars). Full sentences belong
in the activity panel and Alerts.

## Eligibility vs errors

`ineligibilityReason` in `src/backend/eligibility.js` is a **skip** with a user-facing
sentence. Frontend copy lives in `src/frontend/eligibility.ts` — keep them in sync
(Worker cannot import TS). `skipNextStep` says what to change.

V1 multi-container shipments are blocked before selection because V1 has only one
order-level package. Show both remedies in the queue and push result: create one Digit
shipment per pack container, or disconnect ShipStation and reconnect with V2 credentials.

Show Ready / Blocked in the queue **Status** column **before** push so skips are not a
surprise. Do not duplicate that in a second status column — sync state (`pushed`,
`shipped`, errors) replaces Ready/Blocked when a map row exists.

## Scheduled jobs

- `poll-outbound-push` (300s): outbound push when fulfillment method is `scheduled`, plus
  unlabeled-map label pull. Refresh (`POST /sync/poll`) always pushes and pulls labels.
- `appendActivity` on poll errors and operator Refresh; skip flooding the log with
  routine eligibility skips.
