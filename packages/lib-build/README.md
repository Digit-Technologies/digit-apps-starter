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

This package brings its own Vite toolchain. Because it is linked with `file:`, npm installs
that toolchain into the **workspace root** `node_modules`, not the app's — so run
`npm install` from the repo root. Installing only inside the app leaves Vite missing and
`pack` fails.

## Conventions

| Input | Output |
| --- | --- |
| `src/frontend/main.tsx` | `frontend/index.js` (IIFE — the entry, by convention) |
| `src/backend/index.js` (optional) | `backend/index.js` (+ `backend/migrations/*.sql`) |
| Root `manifest.json` | `manifest.json` at the zip root |
| `SPEC.md` + source/tooling | `project/` inside `app.zip` (vendored `@digit/lib-*`) |

Zip root: `manifest.json` + `frontend/` (+ `backend/`) for Digit deploy, plus required
`project/` (source, SPEC, vendored libs — not what Digit deploys).

## Commands

```bash
npm run pack   # digit-app pack → build + app.zip
```

Do not add per-app Vite configs or `scripts/pack.sh` — this package owns them.
