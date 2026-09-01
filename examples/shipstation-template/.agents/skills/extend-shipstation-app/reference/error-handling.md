# Error handling and activity log

Operators must always see **what happened and what that means**. Agents extending this
app must keep that contract. Details live here; recipes and routes only cross-link.

## Immediate UI feedback

- Use in-page MUI `Alert` / `AppErrorAlert` / Dialog. Never `window.alert`.
- Every operator mutation (connect, save settings, disconnect, push, packing-slip
  download) must show **outcome + meaning** after the call returns.
- Do not clear selection, close a dialog, or wipe form state until the result is known.
  On a mixed `/sync/push` batch, uncheck only rows that were actually created in
  ShipStation; keep skipped and failed rows selected.
- Pair `useBackendQuery` / `useBackendMutation` / `useDigitApiQuery` errors with
  `AppErrorAlert`. Surface `DigitHost.download` throws the same way.

Example meaning for a successful push: the Digit sales order **stays in the
unfulfilled queue**; operators print the label in ShipStation; tracking writes back
later.

## HTTP 200 is not “all good”

`POST /sync/push` always returns Worker `{ ok: true, data: { results, summary } }` so a
mixed batch is not a single mutation error.

```js
{
  results: [{ orderId, ok, skipped, ssShipmentId, message, meaning }],
  summary: { pushed, skipped, failed }
}
```

- `skipped: true` is eligibility (`ineligibilityReason`), not success. Show it.
- `ok: false` on a result is a ShipStation or Digit failure; keep that row selected.
- The UI must read `summary` and `meaning`. Do not treat hook `error === null` as
  “every order pushed.”

## Activity log

D1 table `activity_log` (migration `0004_activity_log.sql`). Helpers:
`appendActivity` / `listActivity` in `src/backend/activity.js`.

`GET /sync/activity?organizationId=` returns `{ events }` (newest first, max 100).

Record: `actor` (`user` | `schedule` | `webhook`), `action`, ids, `status`
(`success` | `skipped` | `error`), human `message`, optional `detail` JSON (HTTP
status, `error_code`s, GraphQL `extensions.code`).

**Never** store API keys, `api_key_encrypted`, addresses, tracking numbers, or raw
webhook bodies. Scheduled poll should not flood the log with routine eligibility
skips (those are user-visible on an explicit push).

New sync, connect, webhook, or poll paths must `appendActivity` and refetch
`/sync/activity` from the UI after operator actions.

## Verbose upstream errors

All ShipStation HTTP goes through `ssFetch`. On failure, parse the V2 / ShipEngine
body (`request_id`, `errors[].error_code`, `errors[].message`, `errors[].field_name`).
Confirm the shape on ShipStation docs MCP before changing parsers. Do **not** include
`field_value` (may be PII) or request bodies.

Digit Worker GraphQL (`digitGraphql.js`): include `errors[0].message` and
`extensions.code` when present.

Keep `last_error` / activity `message` truncated (~500 chars). Full sentences belong
in the activity panel and Alerts.

## Eligibility vs errors

`ineligibilityReason` in `src/backend/eligibility.js` is a **skip** with a user-facing
sentence. Frontend copy lives in `src/frontend/eligibility.ts` — keep them in sync
(Worker cannot import TS). `skipNextStep` says what to change.

Show Ready / Blocked in the queue **before** push so skips are not a surprise.

## Webhooks and jobs

- Invalid signature: 401, no body logging, no activity row (unauthenticated noise).
- After verify: enqueue `process-ss-webhook`, then `appendActivity` on skip / error /
  success using event name + Digit order id / ShipStation shipment id only.
