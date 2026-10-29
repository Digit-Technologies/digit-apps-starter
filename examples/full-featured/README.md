# Full Featured

Reference Digit app that exercises the main platform surfaces in one place:

| Tab | What it shows |
| --- | --- |
| Notes | D1 CRUD (`FULL_FEATURED_DB`): list page with `DataTable`, row menu, `Modal` form, `ConfirmDialog` delete; "New note" in the `PageHeader` |
| Items | `useApiQuery` items query (`READ_ITEM`) in a `DataTable` |
| Jobs | Submit `note-stats` via `appJobs`, watch runs; hourly `prune-notes` schedule |
| Backend | Public API (Worker → Open-Meteo via `/proxy/backend/weather`), Secrets (`API_BASE_URL` + `THIRD_PARTY_API_KEY`), Config (env `WELCOME_MESSAGE` via `/proxy/backend/greeting`) |
| Error lab | Canned + live failures through `AppErrorAlert` / mutation hooks |
| Components | A short reference of the themed buttons, fields, choices, pills, alerts and type roles |

Tabs live in `src/frontend/App.tsx`: each entry has a label, its content and optional
`PageHeader` actions. `src/frontend/PageBody.tsx` is the page gutter for content that is not a
full-bleed `DataTable`.

Uses `@heysutton/sdk-react`, `@heysutton/sdk-server`, `@heysutton/sdk`, and
`@heysutton/cli` (`sutton studio pack`).

Layout:

- `src/frontend/` — React UI
- `src/backend/` — Worker (`index.js`, `notes.js`, `jobs.js`, migrations)
- `frontend/` / `backend/` — build outputs (gitignored; produced by pack)
- Root `manifest.json`, `package.json`, `SPEC.md`

Scripts:

- `npm run pack` — `sutton studio pack`: build + `app.zip` for Digit upload

Local Sutton runtime draft is not supported (there is no local Worker / env / D1 harness).
Pack this example for a remote Sutton draft first — a draft isolates Worker/D1/R2 from the published app
but shares published env vars and secrets; schedules and inbound webhooks stay published-only.

### What `pack` puts in `app.zip`

```
manifest.json             # Digit publish config (zip root)
frontend/                 # Digit deploy
backend/                  # Digit deploy
project/                  # Required in the zip — source, SPEC, tooling (not deployed)
  src/, SPEC.md, configs
  packages/sdk*          # vendored (incl. cli) until registry publish
```

## Setup in Digit

1. Create the app in Digit
2. Add env var `WELCOME_MESSAGE`
3. Add env var `API_BASE_URL` (e.g. `https://httpbin.org`) and secret `THIRD_PARTY_API_KEY`
4. `npm run pack`, deploy a draft, and promote it only through the explicit Publish action
   (see the sutton-app skill). Standalone MCP clients can choose a publish channel.

D1 migrations in `src/backend/migrations/` run during the platform deployment when the manifest
declares a `database` binding. Draft migrations apply to draft D1; promotion applies pending
migrations to the published D1 — no manual apply step.

The example's secret-backed HTTP call uses the **same published env and published secrets** as
production. Sutton Settings edits update the published app only. There is no documented app-facing
`isPreview()` helper yet, so do not add irreversible external side effects without an explicit
guard. Draft schedules and inbound webhooks stay off.

## Notes

- Secrets never leave the Worker; the Secrets section only shows a short token prefix
- See `SPEC.md` for iteration context for a later agent (prompts, constraints, gotchas)
