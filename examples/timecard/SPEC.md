# Timecard

Iteration context for the next agent. Keep this current — chat history is not always
available, so this file is how a later session understands the app.

## What it does

Mobile-first, single-view clock in / clock out app for one employee at a time — no tabs,
no secondary navigation. Shows a status card (chip + live pulse, today's elapsed
hours/minutes, "since" time), one full-width toggle button ("Clock in" / "Clock out"),
and a paginated "Recent shifts" glance-back list (10 per page, most recent first). It is
intentionally not a timesheet, does not compute weekly/period totals, and has no payroll
export.

Key behaviors:
- All "today" boundaries and displayed timestamps use the browser/device's local
  timezone (`Intl`/`Date` local methods) — this is a personal single-device clock, not a
  shared kiosk, so there is no org-wide timezone setting.
- Today's elapsed total = sum of `duration_seconds` for completed shifts whose
  `clock_in_time` falls in the local-day window, plus the live elapsed time of an open
  shift if *that* shift also started today.
- Shifts are keyed by `user_id` = Digit `currentUser.id`, so a page refresh mid-shift
  never loses the open clock-in, and each user only ever sees their own shifts.

## Data & permissions

- `manifest.permissions`: `[]`. The only Digit GraphQL field used is
  `currentUser { id }` (type `CurrentUser`), which the schema does not gate behind any
  `apiPermissions` entry — confirmed via `graphql-schema://type/CurrentUser` before
  building. All other reads/writes go through the app's own D1-backed Worker, not the
  Digit API.
- `manifest.backend`: Cloudflare Worker + one D1 binding, `TIMECARD_DB`.
- `shifts` table (`src/backend/migrations/0001_init.sql`): `id`, `user_id`,
  `clock_in_time` / `clock_out_time` (ISO 8601 UTC instants written by the Worker,
  `clock_out_time` NULL while open), `duration_seconds` (NULL while open), timestamps.
  Indexed on `user_id`, `(user_id, clock_out_time)` (find the open shift fast), and
  `(user_id, clock_in_time)` (today-window + pagination queries).
- Worker routes (`src/backend/shifts.js`):
  - `GET /status?userId&dayStart&dayEnd` → `{ activeShift, completedSecondsToday }`.
    `dayStart`/`dayEnd` are the frontend's local-day window in ISO; `activeShift` is
    returned independent of that window (an open shift always renders the badge/timer
    even if it started before local midnight).
  - `GET /shifts?userId&page` → 10-per-page, most-recent-first, with `totalPages`.
  - `POST /clock-in` / `POST /clock-out` — `{ userId }` body; reject (409) if the user is
    already in the requested state, so the single toggle button can't double-fire into an
    inconsistent state.
- No env vars or secrets.
- **Dependency:** `@mui/icons-material` (added for the clock-in/out button icons —
  `AccessTimeIcon` / `StopCircleIcon`). Only these two icons are imported, so tree-shaking
  keeps the bundle impact small (~1KB after the initial add).
- **UI polish:** the status chip/time/since-time live inside a `Paper` card for visual
  grouping; a small CSS `@keyframes` pulse dot appears next to the chip while clocked
  in; elapsed-time and shift-row timestamps use `fontVariantNumeric: 'tabular-nums'` so
  ticking digits don't jitter; each "Recent shifts" row puts the date on the left and
  duration on the right of the same line (receipt-style scan pattern) with the time
  range as a secondary line below.
- **Gotcha (fixed):** `parseJsonResponse({ fields })` expects an object mapping each key to
  a parser *function* (`{ userId: (obj) => requiredString({ obj, key: 'userId' }) }`) — not
  a single function that returns the parsed object. An earlier version of `userIdFields`
  in `shifts.js` was written as the latter; `Object.keys()` on a bare function is empty, so
  `parseObject` silently produced `{}`, `userId` came out `undefined`, and the `/clock-in`
  and `/clock-out` D1 binds threw `D1_TYPE_ERROR`, surfacing to the frontend as a generic
  `SERVER_ERROR` ("Unexpected worker error."). `/status` and `/shifts` (which read `userId`
  from the query string, not a JSON body) were never affected. Reproduced and verified the
  fix locally with `wrangler dev --local` + `wrangler d1 migrations apply --local` against
  the exact bundled `backend/index.js` before republishing.

## Prompts

Can you clone this repo and use the skill within it and the Digit MCP connector to build me an application and publish it to the Digit Staging - Dgit org platform?

https://github.com/Digit-Technologies/digit-apps-starter

App to publish to:
- name: Timecard
- id: 019fde82-6ddd-72b9-8112-d94e6034c49e

What to build:
A mobile-first single-view app for employee clock in / clock out. No secondary navigation.

UI (single column, large tap targets):
- Status badge at top: "Clocked in" or "Clocked out".
- Large elapsed-time display for today as hours + minutes, updating live while clocked in.
- When clocked in, show a secondary line like "since {clock-in time} {timezone}".
- One primary full-width button that toggles: "Clock in" when out, "Clock out" when in.
- Below: "Recent shifts" list for a quick glance back (not a full timesheet, weekly totals, or payroll export) — most recent first, 10 shifts per page, with basic next/previous pagination so older shifts are reachable. Each row shows the date, start–end times with timezone, and total duration.

Data:
- Store shifts in this app's D1 database (declare a database binding in the manifest and follow the starter's Worker + D1 pattern).
- Shift fields: clockInTime, clockOutTime (null while active), and duration.
- Identify the signed-in user with Digit's currentUser query (currentUser.id) — no apiPermissions entry required.
- Key shift records to that user id so refresh doesn't lose an open clock-in.
- Use the browser/device local timezone for "today" day boundaries and all displayed times (personal single-device clock — not a shared kiosk or org-wide timezone). Show the timezone abbreviation on timestamps so the basis is obvious.

Behavior:
- Clock in: create an open shift with clockInTime = now; badge → Clocked in.
- Clock out: set clockOutTime = now, compute duration, update the recent list; badge → Clocked out.
- Today's elapsed time = sum of durations for shifts that started today (device-local day), including live elapsed for an open shift.
- Whole interaction is one tap; no multi-step forms or separate login beyond the existing Digit session.

## Context supplied

Scaffolded from `examples/full-featured` via `npm run new-app -- timecard`. Built by
reading the `create-digit-app` skill end-to-end (manifest, permissions, proxy-and-api,
backend-env-secrets, publish, spec references) plus the full-featured example's
`NotesPanel.tsx` / `DigitApiPanel.tsx` / `src/backend/{index.js,notes.js}` as the D1 CRUD
and Digit-GraphQL-hook reference patterns. Confirmed `CurrentUser.id` needs no permission
via `graphql-schema://type/CurrentUser` on the "Digit Staging - Digit Org" MCP connector
before writing any GraphQL.
