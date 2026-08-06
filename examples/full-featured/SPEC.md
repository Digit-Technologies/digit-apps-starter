# SPEC: Full Featured

## What it does

Kitchen-sink reference Digit app used as the default template for new apps. It is a
tabbed demo of platform surfaces — theme/MUI via `DigitThemeProvider`, shared error UI,
Digit GraphQL (`READ_ITEM` / items), Worker-backed public weather, secrets-backed third-party
HTTP, D1 notes CRUD, an env-driven greeting, and platform jobs & schedules (an hourly
`prune-notes` schedule plus an on-demand `note-stats` job) — not a production business app. Agents
should copy this example and delete tabs/routes they do not need rather than inventing a
new layout.

Local `npm run dev` has no Digit harness, Worker, or D1; tabs that call Digit or the
backend will show unavailable / request errors until the app is published (or otherwise
wired to a real host).

## Data & permissions

- `READ_ITEM` — Digit API tab runs an `items` query; needed so the proxy allows that field
- D1 binding `FULL_FEATURED_DB` — notes table from `src/backend/migrations/0001_init.sql`
  must be applied in Digit before the Notes tab works
- Env `WELCOME_MESSAGE` — greeting text for the Config tab (`GET /greeting`)
- Env `API_BASE_URL` + secret `THIRD_PARTY_API_KEY` — Secrets tab hits an external HTTP API
  from the Worker only; the UI may show a short token prefix for demo, never the full secret
- Schedule `prune-notes` (hourly, manifest `backend.schedules`) deletes notes older than
  `payload.maxAgeDays`; job `note-stats` is submitted via `DIGIT_JOBS` from
  `POST /jobs/note-stats` — handlers in `src/backend/jobs.js`, UI in the Jobs tab

Gotchas: secrets and env are Worker bindings only — never put them in frontend code.
`@digit/lib-*` is linked via `file:` in the monorepo; `digit-app pack` (`@digit/lib-build`)
vendors those packages (including `lib-build`) under `project/packages/` in `app.zip` so a
later agent can rebuild outside this repo. Local Digit preview is not supported yet.

## Prompts

1. Original request:

```
Build a full-featured reference Digit app we can use as the default example for the
starter repo. It should exercise theme/MUI, error handling UI, Digit GraphQL, a Worker
calling a public API, secrets-backed third-party HTTP, D1 CRUD, and env-driven config —
as separate tabs so someone can copy the example and delete what they don't need.
```

2. Follow-up:

```
Use the shared @digit/lib-frontend / lib-backend / lib-common helpers instead of
hand-rolling proxy fetches and Worker response shapes. Keep the stack React + MUI +
DigitThemeProvider.
```

3. Follow-up:

```
Make sure pack produces a zip we can publish and later rehydrate: Digit deploy assets
plus source, SPEC, and tooling, since end users won't have Git.
```

## Context supplied

- Started from the Digit apps starter conventions (skill `create-digit-app`) and the
  shared lib packages in this monorepo — not from a customer production app
- Open-Meteo used as the keyless public API for the weather demo
- httpbin-style bearer check for the secrets demo (`API_BASE_URL` + `THIRD_PARTY_API_KEY`)
- Product decision: one reference app with tabs, not several tiny examples
- Agents iterating later should read this SPEC first, then `src/frontend` / `src/backend`,
  then trim unused panels rather than rewriting the project shape
