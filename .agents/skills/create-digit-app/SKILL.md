---
name: create-digit-app
description: >-
  Build and publish Digit custom apps (React + MUI + Digit theme via
  @digit/lib-frontend, optional Cloudflare Worker backends via @digit/lib-backend,
  Vite IIFE bundles, manifest.json, Digit API proxy, env/secrets). Apps run in a
  locked-down sandboxed iframe (no popups, browser dialogs, clipboard read,
  or device APIs). Use when creating a Digit app, editing an app in a local clone
  of this starter, publishing via MCP, or when the user mentions Digit apps,
  manifest.json, DigitProxyClient, DigitThemeProvider, /proxy/digit, or
  /proxy/backend.
---

# Create Digit App

Build Digit custom apps that run inside Digit as **sandboxed iframes** with a locked-down
Permissions Policy. Follow this skill end-to-end — do not invent alternate layouts,
mount targets, stacks, or publish flows, and do not build features the iframe cannot
support (new tabs/popups, direct browser dialogs, clipboard read, camera, etc.).
Use `DigitHost.download` for files and `DigitHost.print` for printable HTML.
See [reference/iframe-constraints.md](reference/iframe-constraints.md).

**Default stack (required):** React + MUI + `@digit/lib-frontend` (`DigitThemeProvider`).
Do not build vanilla HTML/CSS UI, invent a parallel design system, or skip the theme
package. Users are often non-developers — one path keeps apps looking and behaving
like Digit.

**Digit MCP is required.** Use it for schema lookup, permissions, listing apps, and
publish. If MCP is not connected, stop and ask the user to connect Digit MCP before
continuing.

## When to use

- Creating a new Digit app from scratch
- Adapting one of the `examples/` templates
- Declaring `manifest.json` permissions / backend
- Calling the Digit GraphQL API from an app
- Using app env vars or secrets (backend only)
- Publishing via Digit MCP tools

## Digit MCP (apps)

| Need                      | Use                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Public GraphQL schema     | MCP resources `graphql-schema://index`, `graphql-schema://type/{TypeName}`, `graphql-schema://search/{query}` |
| Manifest permissions      | MCP tool **`appPermissions`** — put each permission’s **`key`** in `manifest.json`                            |
| Find an existing app’s id | MCP tool **`apps`**                                                                                           |
| Publish                   | **`generateAppUploadLink`** → HTTP POST zip → **`publishApp`** → poll **`appPublish`**                        |

There are **no** MCP tools to create, update, or delete apps, or to manage env/secrets —
those stay in the Digit UI. Do not invent them.

Do **not** load the full GraphQL schema into context. Use the schema resources above when
writing or changing Digit API operations. Details:
[reference/proxy-and-api.md](reference/proxy-and-api.md),
[reference/permissions.md](reference/permissions.md).

## Quick workflow

Copy this checklist and track progress:

```
Digit app progress:
- [ ] 1. Use the starter's apps/app, or scaffold apps/<name> for an additional app
- [ ] 2. Confirm the user created the app in Digit (get appId via apps)
- [ ] 3. Implement frontend (React + MUI + DigitThemeProvider → #root)
- [ ] 4. Add src/backend/ only if env/secrets or server logic needed
- [ ] 5. Look up GraphQL via graphql-schema://… and permissions via appPermissions
- [ ] 6. Write root manifest.json (permissions[].key from appPermissions)
- [ ] 7. Check manifest.permissions against appPermissions — confirm it covers every Digit API call the app makes
- [ ] 8. Write/update SPEC.md
- [ ] 9. npm run pack -w apps/<name> → app.zip
- [ ] 10. Publish via MCP (upload zip out-of-band)
- [ ] 11. Keep app source under apps/ — not build outputs; no upstream PRs
```

Schema and permission lookup (steps 5–7) must happen **before publish**. Do them as soon
as you know which Digit API calls the app makes — inventing fields or permission strings
fails at runtime or publish validation. Re-check step 7 whenever you add or change a Digit
API call.

### 1. Scaffold the app

This repo is a single **npm workspace**. Apps live in `apps/<name>` — that depth is
required, because apps depend on the libraries via `file:../../packages/*`.

The curated starter archive already contains `apps/app`, pre-scaffolded from the
frontend-only `examples/hello-world` without build outputs. Use it when there is no
retained publish. Add `src/backend/` only when the app needs server-side functionality.
If a retained publish is supplied, its `project/` tree replaces `apps/app` entirely.
Run `new-app` only when adding another app workspace:

```bash
npm install                     # once per clone, from the repo root
npm run new-app -- my-app       # copies examples/full-featured → apps/my-app
```

`new-app` copies the template, renames the package, writes a `SPEC.md` stub, and re-runs
`npm install` so the workspace links the new app. Trim what you don't need from the copy —
do not invent a new project shape.

The template covers theme, errors, Digit GraphQL (`useDigitApiQuery`), public API, secrets,
D1 via the Worker (`useBackendQuery` / `@digit/lib-backend`), and env config. Keep the
`@digit/lib-build` devDependency and `"pack": "digit-app pack"` — do **not** add Vite
configs, a local pack script, or a per-app `npm install`.

**Always install from the repo root.** `@digit/lib-build` is a `file:` link, so npm puts
its build toolchain (Vite) in the root `node_modules`, not the app's. Running `npm install`
only inside `apps/<name>` leaves Vite missing and `pack` fails.

All apps share React + MUI + `@digit/lib-frontend` and the same folder conventions.
There is no local Digit preview (Worker / env / D1 are platform-injected) — pack + publish
is the path.

**Debugging a published app.** The harness forwards uncaught errors, unhandled rejections,
`console.error` / `console.warn`, bundle load failures and failed Digit API / backend calls
to the Digit host. In Digit Studio they appear in the preview's Console tab and are attached
to the next chat message automatically; elsewhere ask the user to copy them from the Console
tab. Report unexpected states with `console.error` (not `console.log`) so they get there, and
never replace `console.error` or `window.onerror` — wrapping them breaks forwarding.

### 2. App must already exist in Digit

Publishing **never creates** an app. Ask the user to create the app in the Digit UI first,
then resolve its `id` with MCP **`apps`** (or have the user paste it).

### 3. Project layout

```
apps/my-app/
├── package.json            # @digit/lib-* ; "pack": "digit-app pack"
├── manifest.json           # staged at zip root by digit-app pack
├── SPEC.md
├── src/frontend/           # main.tsx → #root + DigitThemeProvider; App.tsx
├── src/backend/            # optional Worker (index.js, migrations/)
├── frontend/               # BUILD — gitignored; frontend/index.js entry
└── backend/                # BUILD when Worker present — gitignored
```

Edit `src/frontend` and `src/backend` only. Harness types come from `@digit/lib-frontend`
— no local `digit.d.ts`. Prefer data hooks over calling `window.DigitProxyClient`.

```bash
npm run pack -w apps/my-app     # from repo root → app.zip
```

`app.zip` has root `manifest.json`, `frontend/` (+ `backend/` when declared), and
`project/` (source + vendored `@digit/lib-*`). Digit deploys `frontend/` / `backend/`
only; still upload the zip **unchanged**. Details:
[reference/manifest.md](reference/manifest.md), [reference/publish.md](reference/publish.md).

### 4. Frontend rules

- **Iframe limits (hard):** Apps run under
  `sandbox="allow-scripts allow-same-origin allow-forms"` and a Permissions Policy
  that sets camera, clipboard-read, fullscreen, geolocation, mic, and related
  features to `'none'`. **Never** implement direct downloads, `window.open` /
  `target="_blank"`, browser `alert`/`confirm`/`prompt`, or device/clipboard-read/
  fullscreen APIs — they will not work. Copy buttons (`navigator.clipboard.writeText`
  in a click handler), form `onSubmit` + `preventDefault`, file exports via
  `DigitHost.download`, and HTML printing via `DigitHost.print` DO work. In-page MUI
  Dialog/Drawer/Snackbar are fine. Never ask to loosen the iframe sandbox. Full
  list: [reference/iframe-constraints.md](reference/iframe-constraints.md).
- **Stack:** React + MUI + `DigitThemeProvider`. Prefer theme palette / typography over
  hard-coded colors or custom CSS. See [reference/theming.md](reference/theming.md).
- **Mount to `#root`.** Do not create a different root id or remove `#root`.
- **Wrap the tree** with `DigitThemeProvider` in `main.tsx` (see the template).
- **Entry is IIFE `frontend/index.js`.** `@digit/lib-build` packs it — no alternate bundler.
- **Digit API:** `useDigitApiQuery` / `useDigitApiMutation`. Look up operations via
  `graphql-schema://…` first. Never call Digit GraphQL with a bearer token from the browser.
- **Sort / filter / page via the API:** When the GraphQL field (or backend route) accepts
  sort, filter, or connection/page inputs, use those — do not fetch a full list and
  sort/filter client-side when the API can do it. Confirm arg names via
  `graphql-schema://…`.
- **Tables need pagination:** Any MUI `Table` (or equivalent list of many rows) must be
  paginated — e.g. `connection: { first, after }` / page size + next/previous — not an
  unbounded dump of nodes.
- **Backend:** `useBackendQuery` / `useBackendMutation` — do not hand-roll `/proxy/backend`.
- **Public surface:** hooks + theme + `AppErrorAlert` only. Pair hook `error` with
  `AppErrorAlert` (`onRetry` when retryable) — do not branch on `AppErrorCode` in UI.

#### Printing

When the user wants invoices, labels, packing slips, or reports, call
`window.DigitHost.print({ title, html })`. Do not use `window.open`, `target="_blank"`,
blob navigation, or a new print window. Never request `allow-modals`, `allow-popups`, or
`allow-downloads` on the app iframe.

Print HTML is a snapshot, not a live app. The host sanitizes it and no JavaScript runs in
the print document. Build a dedicated receipt/print view or hidden print root and serialize
that element with `outerHTML`; do not dump the full SPA chrome with
`document.documentElement.outerHTML`.

Before sending HTML:

- Inline CSS in `<style>` or `style` attributes. The host strips `<link
rel="stylesheet">`, and the print CSP blocks network CSS.
- Fetch images as blobs and convert them with `FileReader` or canvas to `data:image/...`.
  Remote `http(s)` images do not load (`img-src data:`). This is the first thing to check
  when a print is missing images.
- Replace canvas and chart output with `<img src="${canvas.toDataURL('image/png')}">`.
- Use system fonts, or `@font-face` with a `data:` font URL. Remote fonts such as Google
  Fonts do not load.
- Copy printable values into normal elements such as `p`, `table`, `span`, and `div`.
  The host removes `form` (and `script` / `iframe` / `link` / `meta`). `input`, `select`,
  `textarea`, and `button` stay but are inert, and React live values usually are not in
  the HTML.
- Keep the UTF-8 payload under 10MB after inlining. Compress images and print only the
  receipt or report content.
- Use a 1-119 character title made from ASCII letters or digits plus spaces, `.`, `_`, `-`,
  `(`, and `)`. It must start with a letter or digit. Accents and emoji are not allowed.

Do not send PDF bytes to `DigitHost.print`. Download a PDF with
`DigitHost.download({ filename, contentType: 'application/pdf', data })`. Printing only
accepts HTML and opens the browser print dialog.

### 5. `manifest.json`

Keep it at the **project root**. Pack stages it at the zip root.

No `name`, no `entryFile`, no `compatibilityFlags` — display name lives on the app in
Digit; entries are conventions (`frontend/index.js`, `backend/index.js`).

```json
{
  "permissions": [],
  "backend": {
    "kind": "cloudflare-worker",
    "bindings": { "MY_APP_DB": "database" }
  }
}
```

Omit `backend` when the app is UI-only / Digit API only. `bindings` maps
`BINDING_NAME` → `"database"` (one D1 per app) or `"bucket"` (an R2 bucket for
file/blob storage, max 10). Names are `UPPER_SNAKE_CASE` and must not start with
`DIGIT_`.

Optional `backend.schedules` and on-demand jobs:
[reference/jobs-and-schedules.md](reference/jobs-and-schedules.md).
Optional `backend.webhooks` — public inbound POST endpoints at `/webhooks/{path}`; the
handler MUST verify the provider's signature over the raw bytes:
[reference/webhooks.md](reference/webhooks.md).
Full schema: [reference/manifest.md](reference/manifest.md).

### 6. Permissions

`permissions` is the **ceiling** for `/proxy/digit`. Digit intersects it with the viewing
user’s live permissions at runtime.

1. Call MCP **`appPermissions`**
2. Put each needed permission’s **`key`** into `manifest.permissions`
3. Never invent strings — unknown keys fail publish
4. Before pack/publish (checklist step 7), re-read `manifest.permissions` against
   **`appPermissions`** and the app’s Digit API calls — add any missing keys; drop unused
   ones only when you are sure nothing still needs them

Look up GraphQL fields with `graphql-schema://…`, then declare only the permissions those
operations need. Details: [reference/permissions.md](reference/permissions.md).

### 7. Env vars and secrets

Configured on the app in the Digit UI. Injected only into the Worker as `env.KEY`. Read
with `requireEnv` / `optionalEnv` inside `createHandler`. Frontend never embeds secrets —
read env-backed data via backend hooks.
[reference/backend-env-secrets.md](reference/backend-env-secrets.md).

### 8. Publish via MCP

```
apps → generateAppUploadLink → POST zip to uploadUrl → publishApp → poll appPublish
```

The zip does **not** travel through MCP. If you cannot HTTP POST the zip, stop and tell the
user. Run `npm run pack`, then upload **`app.zip` unchanged**.
Full steps: [reference/publish.md](reference/publish.md).

### 9. SPEC.md and local source

Update `SPEC.md` before pack — iteration context for the next agent (purpose, why each
permission/env exists, verbatim prompts, context supplied). Model:
[`examples/full-featured/SPEC.md`](../../../examples/full-featured/SPEC.md).
Details: [reference/spec.md](reference/spec.md).

Keep `apps/<name>/` source on disk. Do not commit build outputs or open PRs against this
upstream starter.

## Decision guide

| Need                                  | Path                                                            |
| ------------------------------------- | --------------------------------------------------------------- |
| Any new app                           | Copy `full-featured`, delete unused tabs/routes                 |
| Digit GraphQL                         | Schema resources → hooks + `appPermissions` → `key` in manifest |
| Env / secrets / D1 / third-party HTTP | Worker + `@digit/lib-backend`                                   |
| Codes / JSON validation               | `@digit/lib-common`                                             |

## Packages (`lib-*`)

Import from each package **root only**. Helpers use **named arguments**. Runtime packages
do **not** re-export each other. Use `@digit/lib-build` only via `npm run pack`.

| Package               | When                            | Role                                                           |
| --------------------- | ------------------------------- | -------------------------------------------------------------- |
| `@digit/lib-frontend` | Always                          | Theme, harness types, data hooks, `AppErrorAlert`              |
| `@digit/lib-backend`  | Worker                          | `createHandler`, `backendPath`, `ok`/`err`, `requireEnv`, jobs |
| `@digit/lib-common`   | With Worker (or code branching) | `AppErrorCode`, result types, validation                       |
| `@digit/lib-build`    | Always (devDependency)          | `digit-app pack`                                               |

### Backend Worker

Always wrap with `createHandler`. Strip `/proxy/backend` via `backendPath`, match
`method` + `path`, return `ok` / `err`. Prefer `requireEnv` over reading `env.KEY`.
Jobs/schedules: `createHandler({ jobs })` + `digitJobs({ env })` —
[reference/jobs-and-schedules.md](reference/jobs-and-schedules.md). Webhooks:
`createHandler({ webhooks })`, verify with `verifyWebhookSignature` before acting —
[reference/webhooks.md](reference/webhooks.md). SQL migrations:
[reference/d1-migrations.md](reference/d1-migrations.md).

See `examples/full-featured/src/backend/index.js` for the reference layout.
Proxy details: [reference/proxy-and-api.md](reference/proxy-and-api.md).

## Additional resources

- [reference/iframe-constraints.md](reference/iframe-constraints.md) — sandboxed iframe limits, host-mediated downloads, and printing
- [reference/theming.md](reference/theming.md) — DigitThemeProvider, MUI theme, DigitHost
- [reference/manifest.md](reference/manifest.md) — schema, backend block, validation rules
- [reference/proxy-and-api.md](reference/proxy-and-api.md) — schema resources, hooks, proxies
- [reference/permissions.md](reference/permissions.md) — appPermissions → key
- [reference/backend-env-secrets.md](reference/backend-env-secrets.md) — env/secrets in Workers
- [reference/jobs-and-schedules.md](reference/jobs-and-schedules.md) — jobs, schedules, DIGIT_JOBS
- [reference/webhooks.md](reference/webhooks.md) — inbound webhooks, signature verification
- [reference/d1-migrations.md](reference/d1-migrations.md) — database SQL applied on publish
- [reference/publish.md](reference/publish.md) — MCP publish workflow and zip rules
- [reference/spec.md](reference/spec.md) — SPEC.md iteration context
- [`packages/lib-build`](../../../packages/lib-build) — `digit-app pack` shared tooling
