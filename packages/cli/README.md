# `@heysutton/cli`

The `sutton` CLI for Sutton custom apps.
**v1 public CLI:** `sutton studio pack`, plus `sutton --help` and `sutton --version`.
Unknown commands, and unknown or missing `studio` subcommands, exit non-zero with usage.

`digit-app` stays as a bin for already-built apps: its `pack` runs
`sutton studio pack`, and it prints a one-line deprecation warning pointing to
`sutton studio pack`.

Programmatic use:

```js
import { pack } from '@heysutton/cli';

await pack({ root: process.cwd() });
```

`pack` loads its code only when it runs, so `--help` and `--version` don't
import Vite. Vite is a regular dependency of this package.

Local Digit runtime draft is not supported (Worker, env/secrets, and D1 are injected by
the platform). Pack builds the channel-neutral deploy assets and writes `app.zip` for a
remote draft or published deployment. See the sutton-app skill for the draft → publish
flow.

## Install (app)

```json
{
  "scripts": {
    "pack": "sutton studio pack"
  },
  "devDependencies": {
    "@heysutton/cli": "file:../../packages/cli"
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
| `src/frontend/main.tsx` | `frontend/index.js` (IIFE — the entry) plus `frontend/assets/` (self-hosted Inter) |
| `src/backend/index.js` (optional) | `backend/index.js` (+ `backend/migrations/*.sql`) |
| Root `manifest.json` | `manifest.json` at the zip root |
| `SPEC.md` + source/tooling | `project/` inside `app.zip` (vendored `@heysutton/sdk*`) |

Zip root: `manifest.json` + `frontend/` (+ `backend/`) for Digit deploy, plus required
`project/` (source, SPEC, vendored libs — not what Digit deploys).

## Commands

```bash
npm run pack   # sutton studio pack → build + app.zip
```

Do not add per-app Vite configs or `scripts/pack.sh` — this package owns them.
