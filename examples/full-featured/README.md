# Full Featured

Reference Digit app that exercises the main platform surfaces in one place:

| Tab | What it shows |
| --- | --- |
| Theme | Typography, buttons, fields, chips, alerts, table via `DigitThemeProvider` |
| Error lab | Canned + live failures through `AppErrorAlert` / mutation hooks |
| Digit API | `useDigitApiQuery` items query (`READ_ITEM`) |
| Public API | Worker → Open-Meteo (no key) via `/proxy/backend/weather` |
| Secrets | Worker → httpbin bearer using `API_BASE_URL` + `THIRD_PARTY_API_KEY` |
| Notes | D1 CRUD (`FULL_FEATURED_DB`) |
| Jobs | Submit `note-stats` via `digitJobs`, watch runs; hourly `prune-notes` schedule |
| Config | Env `WELCOME_MESSAGE` via `/proxy/backend/greeting` |

Uses `@digit/lib-frontend`, `@digit/lib-backend`, `@digit/lib-common`, and
`@digit/lib-build` (`digit-app pack`).

Layout:

- `src/frontend/` — React UI
- `src/backend/` — Worker (`index.js`, `notes.js`, `jobs.js`, migrations)
- `frontend/` / `backend/` — build outputs (gitignored; produced by pack)
- Root `manifest.json`, `package.json`, `SPEC.md`

Scripts:

- `npm run pack` — `digit-app pack`: build + `app.zip` for Digit upload

Local Digit preview is not supported yet (no local Worker / env / D1 harness).

### What `pack` puts in `app.zip`

```
manifest.json             # Digit publish config (zip root)
frontend/                 # Digit deploy
backend/                  # Digit deploy
project/                  # Required in the zip — source, SPEC, tooling (not deployed)
  src/, SPEC.md, configs
  packages/lib-*          # vendored (incl. lib-build) until registry publish
```

## Setup in Digit

1. Create the app in Digit
2. Add env var `WELCOME_MESSAGE`
3. Add env var `API_BASE_URL` (e.g. `https://httpbin.org`) and secret `THIRD_PARTY_API_KEY`
4. `npm run pack` and publish via MCP (see the create-digit-app skill)

D1 migrations in `src/backend/migrations/` run during **publish** (before the Worker goes
live) when the manifest declares a `database` binding — no manual apply step.

## Notes

- Secrets never leave the Worker; the Secrets tab only shows a short token prefix
- See `SPEC.md` for iteration context for a later agent (prompts, constraints, gotchas)
