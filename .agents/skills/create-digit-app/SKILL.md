---
name: create-digit-app
description: >-
  Build and publish Digit custom apps (Vite frontend bundles, optional Cloudflare
  Worker backends, manifest.json, Digit API proxy, env/secrets). Use when creating
  a Digit app, editing an app in this repo, publishing via MCP, or when the user
  mentions Digit apps, manifest.json, DigitProxyClient, /proxy/digit, or
  /proxy/backend.
---

# Create Digit App

Build Digit custom apps that run inside Digit as sandboxed iframes. Follow this skill
end-to-end — do not invent alternate layouts, mount targets, or publish flows.

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
- [ ] 3. Implement frontend (mount #root, Vite → frontend/)
- [ ] 4. Write frontend/manifest.json
- [ ] 5. Add backend/ only if env/secrets or server logic needed
- [ ] 6. Build + zip frontend/ (+ backend/ if any)
- [ ] 7. Publish via MCP (upload zip out-of-band)
- [ ] 8. Write SPEC.md (what it does, prompts, context) and commit app source
```

### 1. Pick a template

Start from the closest example and copy it — do not invent a new project shape:

| Example | Use when |
| --- | --- |
| [`examples/hello-world`](../../../examples/hello-world) | UI-only app, no Digit API, no backend |
| [`examples/digit-api`](../../../examples/digit-api) | App that queries Digit via `DigitProxyClient` |
| [`examples/env-vars`](../../../examples/env-vars) | Backend reads non-secret env vars |
| [`examples/secrets-third-party`](../../../examples/secrets-third-party) | Backend uses a secret to call a third-party API |

All examples share the same Vite + folder conventions. Copy one of those directories; preserve the layout.

### 2. App must already exist in Digit

Publishing **never creates** an app. Ask the user to create the app in the Digit UI first,
then resolve its `id` with the MCP `apps` tool (or have the user paste it).

MCP tools for create/update/delete are not available yet — do not pretend they are.

### 3. Project layout (required)

Source project builds into a publishable folder:

```
my-app/
├── package.json
├── vite.config.ts
├── index.html          # local/dev only — not published
├── src/
│   ├── main.ts         # mounts to #root
│   └── styles.css      # inlined into JS at build time
├── public/
│   └── manifest.json   # copied into frontend/ on build
├── frontend/           # BUILD OUTPUT — what gets zipped
│   ├── manifest.json
│   └── main.js
└── backend/            # only if manifest.backend is set
    ├── worker.js       # single-file Worker ESM
    └── migrations/     # optional *.sql when using D1
        └── 0001_init.sql
```

Zip root must contain `frontend/` (with `frontend/manifest.json`) and, iff the manifest
declares a backend, `backend/worker.js`.

### 4. Frontend rules

- **Mount to `#root`.** The Digit harness provides `<div id="root"></div>`. Do not create a
  different root id.
- **Entry file must be classic-script compatible.** The harness injects
  `<script src="/app/{entryFile}">` without `type="module"`. Build as **IIFE** named
  `main.js` (see example Vite configs).
- **Inline CSS into JS.** Use `vite-plugin-css-injected-by-js` (examples already do). Do not
  rely on a separate CSS file being loaded by the harness.
- **Reserved names:** `entryFile` must not be `index.html` or `loader.js`.
- **Digit API calls:** only via `window.DigitProxyClient.callProxy({ query, variables? })`.
  Never call Digit GraphQL with a bearer token from the browser.
- **Backend calls:** `fetch('/proxy/backend/...', { credentials: 'include', headers: { 'X-Digit-Proxy-Client': '1' } })`.

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
  "permissions": ["read:item"],
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

- Declare only what the app's GraphQL operations need (e.g. `read:item`).
- Look up strings via Digit MCP tool **`apiPermissions`** and put **`value`** in the
  manifest — never use `key` (`READ_ITEM`) or invent a conversion from the schema enum.
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
| Static UI only | `hello-world` — no permissions, no backend |
| Read/write Digit data | `digit-api` — add permissions, use `DigitProxyClient` |
| Non-secret config (API base URL, feature flag) | `env-vars` — backend + env var |
| Third-party API key / credential | `secrets-third-party` — backend + secret |
| Persist app-own data | backend + `backend.d1` + migrations |

## Additional resources

- [reference/manifest.md](reference/manifest.md) — schema, backend block, validation rules
- [reference/proxy-and-api.md](reference/proxy-and-api.md) — DigitProxyClient + backend proxy
- [reference/permissions.md](reference/permissions.md) — permission model and common values
- [reference/backend-env-secrets.md](reference/backend-env-secrets.md) — env/secrets in Workers
- [reference/publish.md](reference/publish.md) — MCP publish workflow and zip rules
- [reference/spec.md](reference/spec.md) — SPEC.md template, provenance, and committing app source
