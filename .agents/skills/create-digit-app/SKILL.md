---
name: create-digit-app
description: >-
  Build and publish Digit custom apps (React + MUI + Digit theme via
  @digit/lib-frontend, optional Cloudflare Worker backends via @digit/lib-backend,
  Vite IIFE bundles, manifest.json, Digit API proxy, env/secrets). Use when creating
  a Digit app, editing an app in this repo, publishing via MCP, or when the user
  mentions Digit apps, manifest.json, DigitProxyClient, DigitThemeProvider,
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
- [ ] 1. Pick an examples/ template
- [ ] 2. Confirm the user created the app in Digit (get appId)
- [ ] 3. Implement frontend (React + MUI + DigitThemeProvider → #root)
- [ ] 4. Write root manifest.json (copied into frontend/ on build)
- [ ] 5. Add src/backend/ only if env/secrets or server logic needed
- [ ] 6. Write/update SPEC.md (iteration context for the next agent)
- [ ] 7. `npm run pack` → app.zip (frontend/ + backend/ + project/)
- [ ] 8. Publish via MCP (upload zip out-of-band)
- [ ] 9. Commit app source in this starter repo (when working here) — not build outputs
```

### 1. Pick a template

Start from [`examples/full-featured`](../../../examples/full-featured) and trim what you
don’t need — do not invent a new project shape.

It covers theme, errors, Digit GraphQL (`useDigitApiQuery`), public API + secrets + D1 via
the Worker (`useBackendQuery` / `@digit/lib-backend`), and env config. Depend on
`@digit/lib-build` and use `"pack": "digit-app pack"` — do **not** copy Vite configs or
a local pack script.

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
my-app/
├── package.json            # @digit/lib-frontend (+ lib-backend/lib-common when Worker);
│                           #   devDependency @digit/lib-build; script "pack": "digit-app pack"
├── manifest.json           # app config — copied into frontend/ by digit-app pack
├── SPEC.md                 # iteration context for the next agent (no chat history)
├── tsconfig.json
├── index.html              # optional local HTML shell (not a Digit preview)
├── src/
│   ├── frontend/           # UI source
│   │   ├── main.tsx        # createRoot(#root) + DigitThemeProvider
│   │   └── App.tsx         # MUI UI
│   └── backend/            # Worker source (when using a backend)
│       ├── worker.js       # entry → backend/worker.js (built by pack)
│       ├── notes.js        # optional — split handlers when a resource grows
│       └── migrations/
├── frontend/               # BUILD OUTPUT — gitignored; produced by digit-app pack
│   ├── manifest.json
│   └── main.js
└── backend/                # BUILD OUTPUT when Worker present — gitignored
    ├── worker.js           # single-file Worker ESM
    └── migrations/         # optional *.sql when using D1
        └── 0001_init.sql
```

Harness types (`DigitHost`, `DigitHostSettings`) come from `@digit/lib-frontend` — do not
add a local `digit.d.ts`. Prefer the data hooks over calling `window.DigitProxyClient`
yourself.

**Source vs publish:** edit under `src/frontend` and `src/backend`. `npm run pack`
(`digit-app pack` from `@digit/lib-build`) builds sibling `frontend/` / `backend/` and
writes `app.zip` — **do not commit** those build folders. Also ignore `node_modules/`,
`.vite/`, and `*.zip`. Do not add per-app Vite configs or `scripts/pack.sh`.

`app.zip` contains:

- **Zip root `frontend/`** (+ `backend/` when present) — what Digit deploys
- **Zip root `project/`** — source, `SPEC.md`, tooling, and vendored `@digit/lib-*`
  (including `lib-build`) under `project/packages/` so a later agent can extract, iterate,
  and pack again without Git

Digit requires `frontend/manifest.json` and, iff the manifest declares a backend,
`backend/worker.js`. The same zip **must** include `project/` for rehydrate. Digit deploys
from `frontend/` / `backend/` only. The local script is `pack` (not `publish` — MCP
`publishApp` is what goes live).

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
  `<script src="/app/{entryFile}">` without `type="module"`. `@digit/lib-build` packs an
  **IIFE** `main.js` — do not invent another bundler setup.
- **Inline CSS into JS.** Handled by `@digit/lib-build` — do not rely on a separate CSS
  file being loaded by the harness.
- **Reserved names:** `entryFile` must not be `index.html` or `loader.js`.
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
copies it into `frontend/` — the publish zip requires `frontend/manifest.json`.

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

### 9. Write SPEC.md (and commit when in this repo)

Published apps often have **no Git**. `SPEC.md` plus `project/` in the pack zip are how the
next agent gets context without chat history. Update SPEC before `npm run pack`.

SPEC is iteration context — not a second README or route list:

- **What it does** — purpose, users, key behaviors, non-obvious constraints
- **Data & permissions** — *why* each permission/env/secret exists; gotchas only (names
  only for secrets)
- **Prompts** — verbatim original + refinements (stand-in for missing chat history)
- **Context supplied** — example copied from, docs/tickets, screenshots, user decisions

Prefer intent / provenance / gotchas; do **not** mirror `manifest.json` or list every
backend path. Model: [`examples/full-featured/SPEC.md`](../../../examples/full-featured/SPEC.md).

In this starter repo, also commit `src/`, root config, and `SPEC.md`. Do not commit built
`frontend/` / `backend/`, `node_modules/`, `.vite/`, or `*.zip`.

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

When a resource grows (CRUD), keep dispatch in `src/backend/worker.js` and move handlers to
a sibling file (see `examples/full-featured/src/backend/notes.js`) — still plain functions,
not a router.

See `examples/full-featured/src/backend/worker.js` for the reference layout.

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
