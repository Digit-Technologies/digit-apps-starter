# `@digit/lib-build`

Shared Digit app tooling. **v1 public CLI:** `digit-app pack` only.

Local Digit preview is not supported yet (Worker, env/secrets, and D1 are injected on
the platform). Pack builds deploy assets and writes `app.zip` for MCP publish.

## Install (app)

```json
{
  "scripts": {
    "pack": "digit-app pack"
  },
  "devDependencies": {
    "@digit/lib-build": "file:../../packages/lib-build"
  }
}
```

## Conventions

| Input | Output |
| --- | --- |
| `src/frontend/main.tsx` + root `manifest.json` | `frontend/main.js` + `frontend/manifest.json` |
| `src/backend/worker.js` (optional) | `backend/worker.js` (+ `backend/migrations/*.sql`) |
| `SPEC.md` + source/tooling | `project/` inside `app.zip` (vendored `@digit/lib-*`) |

Zip root: `frontend/` (+ `backend/`) for Digit deploy, `project/` for later agents.

## Commands

```bash
npm run pack   # digit-app pack → build + app.zip
```

Do not add per-app Vite configs or `scripts/pack.sh` — this package owns them.
