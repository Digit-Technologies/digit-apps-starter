---
name: create-digit-app
description: >-
  Build and publish Digit custom apps (React + MUI + Digit theme via
  @digit/lib-frontend, optional Cloudflare Worker backends via @digit/lib-backend,
  Vite IIFE bundles, manifest.json, Digit API proxy, env/secrets). Use when creating
  a Digit app, editing an app in a local clone of this starter, publishing via MCP, or when
  the user mentions Digit apps, manifest.json, DigitProxyClient, DigitThemeProvider,
  /proxy/digit, or /proxy/backend.
---

# Create Digit App

Build Digit custom apps that run inside Digit as sandboxed iframes. Follow this skill
end-to-end — do not invent alternate layouts, mount targets, stacks, or publish flows.

**Default stack (required):** React + MUI + `@digit/lib-frontend` (`DigitThemeProvider`).
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
- [ ] 1. Scaffold apps/<name> (npm run new-app -- <name>)
- [ ] 2. Confirm the user created the app in Digit (get appId)
- [ ] 3. Implement frontend (React + MUI + DigitThemeProvider → #root)
- [ ] 4. Write root manifest.json (staged at the zip root by pack)
- [ ] 5. Add src/backend/ only if env/secrets or server logic needed
- [ ] 6. Write/update SPEC.md (iteration context for the next agent)
- [ ] 7. `npm run pack -w apps/<name>` → app.zip (frontend/ + backend/ + project/)
- [ ] 8. Publish via MCP (upload zip out-of-band)
- [ ] 9. Keep app source in the local workspace under apps/ — not build outputs; no upstream PRs
```

### 1. Scaffold the app

This repo is a single **npm workspace**. Apps live in `apps/<name>` — that depth is
required, because apps depend on the libraries via `file:../../packages/*`.

```bash
npm install                     # once per clone, from the repo root
npm run new-app -- my-app       # copies examples/full-featured → apps/my-app
```

`new-app` copies the template, renames the package, writes a `SPEC.md` stub, and re-runs
`npm install` so the workspace links the new app. Trim what you don't need from the copy —
do not invent a new project shape.

The template covers theme, errors, Digit GraphQL (`useDigitApiQuery`), public API + secrets
+ D1 via the Worker (`useBackendQuery` / `@digit/lib-backend`), and env config. Keep the
`@digit/lib-build` devDependency and `"pack": "digit-app pack"` — do **not** add Vite
configs, a local pack script, or a per-app `npm install`.

**Always install from the repo root.** `@digit/lib-build` is a `file:` link, so npm puts
its build toolchain (Vite) in the root `node_modules`, not the app's. Running `npm install`
only inside `apps/<name>` leaves Vite missing and `pack` fails.

All apps share React + MUI + `@digit/lib-frontend` and the same folder conventions.
Local Digit preview is **not** supported yet (Worker / env / D1 are platform-injected);
pack + publish is the path.

### 2. App must already exist in Digit

Publishing **never creates** an app. Ask the user to create the app in the Digit UI first,
then resolve its `id` with the MCP `apps` tool (or have the user paste it).

MCP tools for create/update/delete are not available yet — do not pretend they are.

### 3. Project layout (required)

Source project builds into a publishable folder:

```
digit-apps-starter/         # workspace root — run npm install here
├── package.json            # workspaces: packages/*, examples/*, apps/*
├── packages/               # @digit/lib-* (do not copy into the app)
└── apps/
    └── my-app/             # your app — exactly this depth
```

```
apps/my-app/
├── package.json            # @digit/lib-frontend (+ lib-backend/lib-common when Worker);
│                           #   devDependency @digit/lib-build; script "pack": "digit-app pack"
├── manifest.json           # app config — staged at the zip root by digit-app pack
├── SPEC.md                 # iteration context for the next agent (no chat history)
├── tsconfig.json
├── index.html              # optional local HTML shell (not a Digit preview)
├── src/
│   ├── frontend/           # UI source
│   │   ├── main.tsx        # createRoot(#root) + DigitThemeProvider
│   │   └── App.tsx         # MUI UI
│   └── backend/            # Worker source (when using a backend)
│       ├── index.js        # entry → backend/index.js (built by pack)
│       ├── notes.js        # optional — split handlers when a resource grows
│       └── migrations/
├── frontend/               # BUILD OUTPUT — gitignored; produced by digit-app pack
│   └── index.js            # the entry, by convention (not configurable)
└── backend/                # BUILD OUTPUT when Worker present — gitignored
    ├── index.js            # single-file Worker ESM
    └── migrations/         # optional *.sql when using D1
        └── 0001_init.sql
```

Harness types (`DigitHost`, `DigitHostSettings`) come from `@digit/lib-frontend` — do not
add a local `digit.d.ts`. Prefer the data hooks over calling `window.DigitProxyClient`
yourself.

**Source vs publish:** edit under `src/frontend` and `src/backend`. `digit-app pack` (from
`@digit/lib-build`) builds sibling `frontend/` / `backend/` and writes `app.zip` — **do not
commit** those build folders. Run it either way:

```bash
npm run pack -w apps/my-app     # from the repo root
cd apps/my-app && npm run pack  # from the app
```

`node_modules/`, `.vite/`, `*.zip`, and `apps/*/frontend/` + `apps/*/backend/` are already
gitignored. Do not add per-app Vite configs or `scripts/pack.sh`.

`app.zip` contains:

- **Zip root `manifest.json`** — Digit publish config, sibling of the trees below
- **Zip root `frontend/`** (+ `backend/` when present) — what Digit deploys
- **Zip root `project/`** — source, `SPEC.md`, tooling, and vendored `@digit/lib-*`
  (including `lib-build`) under `project/packages/` — required in the zip; Digit does
  **not** deploy it (deploy uses `frontend/` / `backend/` only)

Digit requires root `manifest.json`, `frontend/index.js`, and, iff the manifest declares a
backend, `backend/index.js`. Digit deploys from `frontend/` / `backend/` only. The local
script is `pack` (not `publish` — MCP `publishApp` is what goes live).

### 4. Frontend rules

- **Stack:** React + MUI + `DigitThemeProvider` from `@digit/lib-frontend`. Use MUI
  components (`Box`, `Typography`, `Button`, `TextField`, `Stack`, tables, etc.).
  Prefer theme palette / typography over hard-coded colors or custom CSS.
- **Mount to `#root`.** The Digit harness provides `<div id="root"></div>`. Do not create a
  different root id. Do not replace or remove `#root`.
- **Wrap the tree:**

  ```tsx
  import { createRoot } from 'react-dom/client';
  import { DigitThemeProvider } from '@digit/lib-frontend';
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
  also sets `data-theme` on `<html>` and may ship Inter. Styling is MUI +
  `DigitThemeProvider` — do not invent a CSS-variable theme or a separate theme toggle
  unless the product requires it.
- **Entry file must be classic-script compatible.** The harness injects
  `<script src="/app/index.js">` without `type="module"` — the entry is `frontend/index.js`
  by convention, not configurable. `@digit/lib-build` packs an **IIFE** `index.js` — do not
  invent another bundler setup.
- **Inline CSS into JS.** Handled by `@digit/lib-build` — do not rely on a separate CSS
  file being loaded by the harness.
- **Reserved names:** the bundle must not contain `frontend/index.html` or
  `frontend/loader.js` (harness-owned).
- **Digit API calls:** prefer `useDigitApiQuery` / `useDigitApiMutation` from
  `@digit/lib-frontend`. Never call Digit GraphQL with a
  bearer token from the browser.
- **Backend calls:** prefer `useBackendQuery` / `useBackendMutation`.
  Do not hand-roll `/proxy/backend` fetches without `X-Digit-Proxy-Client`.
- **Public surface is hooks + theme + errors only.** Imperative `digitRequest` /
  `backendFetch` are package-private — do not re-export or deep-import them.
- **Errors:** pair hook `error` with `AppErrorAlert` (`onRetry` when retryable). Known
  platform / backend codes get titles, messages, and next-step guidance inside the
  component — do not branch on `AppErrorCode` in app UI.

### 5. `manifest.json`

Keep the source file at the **project root** (next to `package.json`). `digit-app pack`
stages it at the **zip root** — the publish zip requires `manifest.json` as a sibling of
`frontend/` / `backend/`.

No `name`, no `entryFile`, no `compatibilityFlags` — the display name lives on the app in
Digit, entries are conventions (`frontend/index.js`, `backend/index.js`), and compat flags
are platform-set.

Minimal:

```json
{
  "permissions": []
}
```

With Digit API access + optional backend:

```json
{
  "permissions": ["READ_ITEM"],
  "backend": {
    "kind": "cloudflare-worker",
    "bindings": { "MY_APP_DB": "database" }
  }
}
```

`bindings` maps `BINDING_NAME` → type (`"database"` = a platform-provisioned D1; one
database per app for now). Names are `UPPER_SNAKE_CASE` and must not start with the
reserved `DIGIT_` prefix.

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
Worker** as `env.KEY` bindings (`UPPER_SNAKE_CASE`). Read them with `requireEnv` /
`optionalEnv` inside `createHandler` — see [reference/backend-env-secrets.md](reference/backend-env-secrets.md).

- Frontend must never embed secrets.
- Frontend reads env-backed data only via `useBackendQuery` / `useBackendMutation`.
- Keys must be unique across env vars and secrets.

### 8. Publish via MCP

```
apps → generateAppUploadLink → POST zip to uploadUrl → publishApp → poll appPublish
```

The zip does **not** travel through MCP. If you cannot HTTP POST the zip, stop and tell the
user.

Run `npm run pack`, then upload **`app.zip` unchanged** (includes required `project/`).
Do not strip folders or re-zip by hand.

Full steps: [reference/publish.md](reference/publish.md)

### 9. Write SPEC.md (and keep source in the workspace)

`SPEC.md` is how the next agent (or a later turn without full chat history) understands the
app. Update SPEC before `npm run pack`.

SPEC is iteration context — not a second README or route list:

- **What it does** — purpose, users, key behaviors, non-obvious constraints
- **Data & permissions** — *why* each permission/env/secret exists; gotchas only (names
  only for secrets)
- **Prompts** — verbatim original + refinements (stand-in for missing chat history)
- **Context supplied** — example copied from, docs/tickets, screenshots, user decisions

Prefer intent / provenance / gotchas; do **not** mirror `manifest.json` or list every
backend path. Model: [`examples/full-featured/SPEC.md`](../../../examples/full-featured/SPEC.md).

Keep `apps/<name>/src/`, root config, `manifest.json`, and `SPEC.md` on disk in this
workspace so later sessions can iterate. Do not commit built `frontend/` / `backend/`,
`node_modules/`, `.vite/`, or `*.zip`. Do **not** push or open pull requests against this
upstream starter — it is a public template, not a contribution target. Local git commits
in the clone are optional if that helps the user’s own workflow.

Details: [reference/spec.md](reference/spec.md)

## Decision guide

| Need | Path |
| --- | --- |
| Any new app | Copy `full-featured`, delete unused tabs/routes |
| Digit GraphQL | `useDigitApiQuery` / `useDigitApiMutation` + manifest permissions |
| Env / secrets / D1 / third-party HTTP | Worker + `@digit/lib-backend` (`createHandler`, `backendPath`, `requireEnv`, `ok`/`err`) + plain `fetch` |
| Codes / JSON validation | `@digit/lib-common` (`AppErrorCode`, `parseJsonResponse`, `requiredString`, …) |

Always keep React + MUI + `@digit/lib-frontend`. Prefer `@digit/lib-backend` helpers in
Workers so result shapes match `useBackendQuery` on the frontend.

## Packages (`lib-*`)

Packages under [`packages/`](../../../packages). For runtime libs, import from each package
**root only** — files under `src/` are implementation details. Helpers use **named
arguments**. Runtime packages do **not** re-export each other. Use `@digit/lib-build` only
via the `digit-app` CLI (`npm run pack`).

| Package | Depend from apps? | Role |
| --- | --- | --- |
| [`@digit/lib-frontend`](../../../packages/lib-frontend) | Always | `DigitThemeProvider`, harness types, data hooks, `AppErrorAlert` |
| [`@digit/lib-backend`](../../../packages/lib-backend) | When shipping a Worker | `createHandler`, `backendPath`, `ok`/`err`, `requireEnv` |
| [`@digit/lib-common`](../../../packages/lib-common) | With a Worker (or UI that branches on codes) | `AppErrorCode`, result **types**, pure validation |
| [`@digit/lib-build`](../../../packages/lib-build) | Always (devDependency) | `digit-app pack` — Vite build + `app.zip` |

**Import map**

| Need | Import from |
| --- | --- |
| Theme, hooks, `AppErrorAlert` | `@digit/lib-frontend` |
| `createHandler`, `backendPath`, `ok`/`err`, `requireEnv` | `@digit/lib-backend` |
| `AppErrorCode`, `parseJsonResponse`, `requiredString`, result types | `@digit/lib-common` |

### Frontend public API (`@digit/lib-frontend`)

- `DigitThemeProvider`
- Hooks: `useDigitApiQuery` / `useDigitApiMutation` / `useBackendQuery` / `useBackendMutation`
- `AppErrorAlert` + `AppError` type
- Types: `DigitHost`, `DigitHostSettings`, `DigitResult`

Do not deep-import theme tokens, parsers, or imperative fetch helpers.

### Backend Worker conventions (`@digit/lib-backend`)

Always wrap the Worker:

```js
import { AppErrorCode } from '@digit/lib-common';
import {
  backendPath,
  createHandler,
  err,
  ok,
  requireEnv,
} from '@digit/lib-backend';

export default createHandler({
  fetch: async ({ request, env }) => {
    const path = backendPath(request); // strips `/proxy/backend`
    const { method } = request;

    if (method === 'GET' && path === '/greeting') {
      return ok({ data: { message: requireEnv({ env, key: 'WELCOME_MESSAGE' }) } });
    }

    return err({ code: AppErrorCode.NOT_FOUND, message: 'Not found.', status: 404 });
  },
});
```

- **`createHandler`** — every response is `{ ok: true, data }` / `{ ok: false, error }`;
  unexpected throws become `SERVER_ERROR` without leaking details
- **`backendPath(request)`** — strip `/proxy/backend`, then match with normal
  `method` + `path` checks (and `path.startsWith` / `path.slice` for params). Do not invent
  a custom router unless the app truly needs one
- **`return err({ code, message, status })`** — expected domain failures (not found,
  validation, upstream). Prefer this over throwing
- **`requireEnv({ env, key })`** — missing env/secret/binding throws `HandlerError`
  (mapped by `createHandler`). Prefer this over reading `env.KEY` directly. Apps should
  almost never construct `HandlerError` themselves
- **Upstream HTTP** — plain `fetch`; map failures with
  `AppErrorCode.UPSTREAM_ERROR`. Never put secrets or raw upstream bodies into
  `error.message` / `data`
- **Wire shape:** Worker `ok`/`err` use `data` on success. Validation helpers return
  `{ ok, value }` / `{ ok, error }` — different from the Response helpers

When a resource grows (CRUD), keep dispatch in `src/backend/index.js` and move handlers to
a sibling file (see `examples/full-featured/src/backend/notes.js`) — still plain functions,
not a router.

See `examples/full-featured/src/backend/index.js` for the reference layout.

### Theme / UI don’ts

- Docs: [reference/theming.md](reference/theming.md)
- Do **not** invent cream/teal palettes, alternate fonts, or card-heavy custom CSS
- Do **not** put React/MUI in the harness HTML — the bundle owns UI; the harness only
  provides `#root`, fonts, and `DigitHost` / `DigitProxyClient`

## Additional resources

- [reference/theming.md](reference/theming.md) — DigitThemeProvider, MUI theme, DigitHost
- [reference/manifest.md](reference/manifest.md) — schema, backend block, validation rules
- [reference/proxy-and-api.md](reference/proxy-and-api.md) — DigitProxyClient + backend proxy
- [reference/permissions.md](reference/permissions.md) — permission model and common values
- [reference/backend-env-secrets.md](reference/backend-env-secrets.md) — env/secrets in Workers
- [reference/publish.md](reference/publish.md) — MCP publish workflow and zip rules
- [reference/spec.md](reference/spec.md) — SPEC.md iteration context, provenance, zip vs git
- [`packages/lib-build`](../../../packages/lib-build) — `digit-app pack` shared tooling
