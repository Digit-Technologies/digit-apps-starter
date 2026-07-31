# Full Featured

Reference Digit app that exercises the main platform surfaces in one place:

| Tab | What it shows |
| --- | --- |
| Theme | Typography, buttons, fields, chips, alerts, table via `DigitThemeProvider` |
| Error lab | Canned + live failures through `AppErrorAlert` / `parseProxyBody` / `parseBackendResponse` |
| Digit API | `useDigitApiQuery` items query (`READ_ITEM`) |
| Public API | Worker → Open-Meteo (no key) via `/proxy/backend/weather` |
| Secrets | Worker → httpbin bearer using `API_BASE_URL` + `THIRD_PARTY_API_KEY` |
| Notes | D1 CRUD (`FULL_FEATURED_DB`) |
| Config | Env `WELCOME_MESSAGE` via `/proxy/backend/greeting` |

Uses `@digit/app-frontend`, `@digit/app-backend`, and `@digit/app-shared` (via those
packages) for theme, errors, results, and validation.

- `npm run build:frontend` → `vite.frontend.config.ts` → `frontend/main.js`
- `npm run build:backend` → `vite.backend.config.ts` → `backend/worker.js`
- `npm run build` runs both


## Setup in Digit

1. Create the app in Digit
2. Add env var `WELCOME_MESSAGE`
3. Add env var `API_BASE_URL` (e.g. `https://httpbin.org`) and secret `THIRD_PARTY_API_KEY`
4. Apply D1 migration `worker/migrations/0001_init.sql` against the app database
5. Build and publish

```bash
npm install
npm run build
```

Zip must contain `frontend/` and `backend/` (including `backend/migrations/`).

## Notes

- Local `npm run dev` has no harness / Worker / D1 — tabs that call Digit will show
  unavailable or request errors until published
- Secrets never leave the Worker; the Secrets tab only shows a short token prefix
