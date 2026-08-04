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
| Config | Env `WELCOME_MESSAGE` via `/proxy/backend/greeting` |

Uses `@digit/lib-frontend`, `@digit/lib-backend`, `@digit/lib-common`, and
`@digit/lib-build` (`digit-app pack`).

Layout:

- `src/frontend/` — React UI
- `src/backend/` — Worker (`worker.js`, `notes.js`, migrations)
- `frontend/` / `backend/` — build outputs (gitignored; produced by pack)
- Root `manifest.json`, `package.json`, `SPEC.md`

Scripts:

- `npm run pack` — `digit-app pack`: build + `app.zip` for Digit upload

Local Digit preview is not supported yet (no local Worker / env / D1 harness).

### What `pack` puts in `app.zip`

```
frontend/                 # Digit deploy
backend/                  # Digit deploy
project/                  # Next-agent rehydrate
  src/, SPEC.md, configs
  packages/lib-*          # vendored (incl. lib-build) until registry publish
```

After extract: `cd project && npm install`, edit, then `npm run pack` again.

## Setup in Digit

1. Create the app in Digit
2. Add env var `WELCOME_MESSAGE`
3. Add env var `API_BASE_URL` (e.g. `https://httpbin.org`) and secret `THIRD_PARTY_API_KEY`
4. Apply D1 migration `src/backend/migrations/0001_init.sql` against the app database
5. `npm run pack` and publish via MCP (see the create-digit-app skill)

## Notes

- Secrets never leave the Worker; the Secrets tab only shows a short token prefix
- See `SPEC.md` for iteration context for a later agent (prompts, constraints, gotchas)
