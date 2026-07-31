---
name: create-digit-app
description: >-
  Build and publish Digit custom apps (React + MUI + Digit theme, Vite IIFE
  bundles, optional Cloudflare Worker backends, manifest.json, Digit API proxy,
  env/secrets). Use when creating a Digit app, editing an app in this repo,
  publishing via MCP, or when the user mentions Digit apps, manifest.json,
  DigitProxyClient, DigitThemeProvider, /proxy/digit, or /proxy/backend.
---

# Create Digit App

Build Digit custom apps that run inside Digit as sandboxed iframes. Follow this skill
end-to-end — do not invent alternate layouts, mount targets, stacks, or publish flows.

**Default stack (required):** React + MUI + `@digit/app-frontend` (`DigitThemeProvider`).
Do not build vanilla HTML/CSS UI, invent a parallel design system, or skip the theme
package. Users are often non-developers — one path keeps apps looking and behaving
like Digit.

## When to use

- Creating a new Digit app from scratch
- Adapting one of the `examples/` templates
- Declaring `manifest.json` permissions / backend
- Calling the Digit GraphQL API from an app
- Using app env vars or secrets (backend only)
- Publishing via Digit MCP tools

## Quick workflow

Copy this checklist and track progress:

```
Digit app progress:
- [ ] 1. Pick an examples/ template
- [ ] 2. Confirm the user created the app in Digit (get appId)
- [ ] 3. Implement frontend (React + MUI + DigitThemeProvider → #root)
- [ ] 4. Write frontend/manifest.json
- [ ] 5. Add backend/ only if env/secrets or server logic needed
- [ ] 6. Build + zip frontend/ (+ backend/ if any)
- [ ] 7. Publish via MCP (upload zip out-of-band)
- [ ] 8. Write SPEC.md (what it does, prompts, context) and commit app source
```

### 1. Pick a template

Start from [`examples/full-featured`](../../../examples/full-featured) and trim what you
don’t need — do not invent a new project shape.

It covers theme, errors, Digit GraphQL (`useDigitApiQuery`), public API + secrets + D1 via
the Worker (`useBackendQuery` / `@digit/app-backend`), and env config. Copy its
`vite.frontend.config.ts` / `vite.backend.config.ts` and `build:frontend` /
`build:backend` scripts when you keep a Worker (helpers bundle into `backend/worker.js`).

All apps share React + MUI + `@digit/app-frontend` and the same folder conventions.

### 2. App must already exist in Digit

Publishing **never creates** an app. Ask the user to create the app in the Digit UI first,
then resolve its `id` with the MCP `apps` tool (or have the user paste it).

MCP tools for create/update/delete are not available yet — do not pretend they are.

### 3. Project layout (required)

Source project builds into a publishable folder:

```
my-app/
├── package.json            # @digit/app-frontend (+ @digit/app-backend when using a Worker)
├── vite.frontend.config.ts # React plugin + IIFE main.js + preserveSymlinks
├── vite.backend.config.ts  # optional — Vite lib build → backend/worker.js
├── index.html              # local/dev only — not published
├── src/
│   ├── main.tsx            # createRoot(#root) + DigitThemeProvider
│   └── App.tsx             # MUI UI
├── public/
│   └── manifest.json       # copied into frontend/ on build
├── worker/                 # source Worker (when using a backend)
│   ├── worker.js
│   └── migrations/
├── frontend/               # BUILD OUTPUT — what gets zipped
│   ├── manifest.json
│   └── main.js
└── backend/                # BUILD OUTPUT when manifest.backend is set
    ├── worker.js           # single-file Worker ESM (Vite-bundled if using @digit/app-backend)
    └── migrations/         # optional *.sql when using D1
        └── 0001_init.sql
```

Harness types (`DigitHost`, `DigitHostSettings`) come from `@digit/app-frontend` — do not
add a local `digit.d.ts`. Prefer the data hooks over calling `window.DigitProxyClient`
yourself.

Zip root must contain `frontend/` (with `frontend/manifest.json`) and, iff the manifest
declares a backend, `backend/worker.js`. Scripts: `build:frontend`, optional `build:backend`,
and `build` that runs both.

### 4. Frontend rules

- **Stack:** React + MUI + `DigitThemeProvider` from `@digit/app-frontend`. Use MUI
  components (`Box`, `Typography`, `Button`, `TextField`, `Stack`, tables, etc.).
  Prefer theme palette / typography over hard-coded colors or custom CSS.
- **Mount to `#root`.** The Digit harness provides `<div id="root"></div>`. Do not create a
  different root id. Do not replace or remove `#root`.
- **Wrap the tree:**

  ```tsx
  import { createRoot } from 'react-dom/client';
  import { DigitThemeProvider } from '@digit/app-frontend';
  import App from './App';

  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('Digit apps must mount to #root');

  createRoot(rootEl).render(
    <DigitThemeProvider>
      <App />
    </DigitThemeProvider>,
  );
  ```

- **Theme sync:** `DigitThemeProvider` reads `window.DigitHost` (light/dark). The harness
  also sets `data-theme` on `<html>` and ships Digit CSS tokens + Inter. Do not invent a
  separate theme toggle unless the product requires it.
- **Entry file must be classic-script compatible.** The harness injects
  `<script src="/app/{entryFile}">` without `type="module"`. Build as **IIFE** named
  `main.js` (see example Vite configs).
- **Inline CSS into JS.** Use `vite-plugin-css-injected-by-js` (examples already do). Do not
  rely on a separate CSS file being loaded by the harness.
- **Vite + `file:` packages:** set `resolve: { preserveSymlinks: true }` so React/MUI
  peers resolve from the app’s `node_modules`. Use `vite.frontend.config.ts` /
  `npm run build:frontend` (and `vite.backend.config.ts` / `build:backend` when shipping a
  Worker).
- **Reserved names:** `entryFile` must not be `index.html` or `loader.js`.
- **Digit API calls:** prefer `useDigitApiQuery` / `useDigitApiMutation` from
  `@digit/app-frontend`. Never call Digit GraphQL with a
  bearer token from the browser.
- **Backend calls:** prefer `useBackendQuery` / `useBackendMutation`.
  Do not hand-roll `/proxy/backend` fetches without `X-Digit-Proxy-Client`.

### 5. `manifest.json`

Minimal:

```json
{
  "name": "Hello World",
  "entryFile": "main.js",
  "permissions": []
}
```

With Digit API access + optional backend:

```json
{
  "name": "Items Browser",
  "entryFile": "main.js",
  "permissions": ["READ_ITEM"],
  "backend": {
    "kind": "cloudflare-worker",
    "d1": { "binding": "MY_APP_DB" }
  }
}
```

Details: [reference/manifest.md](reference/manifest.md)

### 6. Permissions

`permissions` is the **ceiling** for what the app may do through `/proxy/digit`. At runtime
Digit intersects that list with the viewing user's live permissions.

- Declare only what the app's GraphQL operations need (e.g. `READ_ITEM`).
- Look up strings via Digit MCP tool **`apiPermissions`** and put **`key`**
  (`READ_ITEM`, `READ_ORDER_COST_INFO`) in the manifest — never invent strings.
- Unknown strings fail publish validation.
- Details: [reference/permissions.md](reference/permissions.md)

### 7. Env vars and secrets

Configured on the app in Digit (create/update app UI). **Injected only into the backend
Worker** as `env.KEY` bindings (`UPPER_SNAKE_CASE`).

- Frontend must never embed secrets.
- Frontend reads env-backed data only by calling `/proxy/backend/...`.
- Keys must be unique across env vars and secrets.

Details: [reference/backend-env-secrets.md](reference/backend-env-secrets.md)

### 8. Publish via MCP

```
apps → generateAppUploadLink → POST zip to uploadUrl → publishApp → poll appPublish
```

The zip does **not** travel through MCP. If you cannot HTTP POST the zip, stop and tell the
user.

Full steps: [reference/publish.md](reference/publish.md)

### 9. Write SPEC.md and commit the app

Publishing to Digit is not the same as preserving the app. Every app directory in this repo
must also be committed as source, with a `SPEC.md` that lets a different agent — with no
memory of this conversation — rebuild it from scratch:

- **What it does** — purpose, users, key behaviors and constraints
- **Data & permissions** — permissions declared, GraphQL fields relied on, env vars/secrets
  (names only), any schema gotchas discovered
- **Prompts** — the verbatim prompts (original + refinements) that produced the app, in order
- **Context supplied** — anything else that shaped it: example copied from, docs/tickets
  linked, screenshots, existing objects used as a model

Commit `src/`, `worker/` (if any), `public/manifest.json`, `package.json`, `README.md`, and
`SPEC.md`. Do not commit `node_modules/`, `*.zip`, or the generated `frontend/`/`backend/`
build output (gitignored, rebuild via `npm run build`).

Details: [reference/spec.md](reference/spec.md)

## Decision guide

| Need | Path |
| --- | --- |
| Any new app | Copy `full-featured`, delete unused tabs/routes |
| Digit GraphQL | `useDigitApiQuery` / `useDigitApiMutation` + manifest permissions |
| Env / secrets / D1 / third-party HTTP | Worker + `@digit/app-backend` (`requireEnv`, `ok`/`err`) + plain `fetch` |
| Shared validation / results | `@digit/app-shared` (`parseObject`, `requiredString`, …) — also re-exported from frontend/backend |

Always keep React + MUI + `@digit/app-frontend`. Prefer `@digit/app-backend` helpers in
Workers so result shapes match `useBackendQuery` on the frontend.

## Theming & packages

Import from the package root only (`DigitThemeProvider`, hooks, `ok`/`err`, …).
Other files under each package’s `src/` are implementation details.

- Frontend: [`packages/app-frontend`](../../../packages/app-frontend) (`@digit/app-frontend`)
- Backend: [`packages/app-backend`](../../../packages/app-backend) (`@digit/app-backend`)
- Shared: [`packages/app-shared`](../../../packages/app-shared) (`@digit/app-shared`) — codes,
  results, pure validation
- Docs: [reference/theming.md](reference/theming.md)
- Do **not** invent cream/teal palettes, alternate fonts, or card-heavy custom CSS.
- Do **not** put React/MUI in the harness HTML — the bundle owns UI; the harness only
  provides `#root`, Inter, CSS tokens, and `DigitHost` / `DigitProxyClient`.

## Additional resources

- [reference/theming.md](reference/theming.md) — DigitThemeProvider, tokens, DigitHost
- [reference/manifest.md](reference/manifest.md) — schema, backend block, validation rules
- [reference/proxy-and-api.md](reference/proxy-and-api.md) — DigitProxyClient + backend proxy
- [reference/permissions.md](reference/permissions.md) — permission model and common values
- [reference/backend-env-secrets.md](reference/backend-env-secrets.md) — env/secrets in Workers
- [reference/publish.md](reference/publish.md) — MCP publish workflow and zip rules
- [reference/spec.md](reference/spec.md) — SPEC.md template, provenance, and committing app source
