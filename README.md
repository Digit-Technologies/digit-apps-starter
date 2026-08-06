# digit-apps-starter

Skills, shared libraries, and an example app for building on the Digit Apps platform.

This repo is a **starter**, not a place to keep production apps. Agents clone it, adapt the
example, pack, and publish to Digit. Source of truth after publish is Digit (`project/` inside
the upload zip) — later agents download from the platform and iterate there.

## Quick start

```bash
npm install                                              # once per clone, from the repo root
cp -R examples/full-featured examples/my-app             # working copy (keep full-featured intact)
# edit examples/my-app, then:
npm install                                              # link the new workspace member
npm run pack -w examples/my-app                          # → examples/my-app/app.zip
```

This repo is one npm workspace (`packages/*`, `examples/*`). Always install from the repo
root — `@digit/lib-build` is linked with `file:`, so npm installs its Vite build toolchain
into the root `node_modules` rather than the app's.

## Agent skill

Agents should follow:

[`.agents/skills/create-digit-app/SKILL.md`](.agents/skills/create-digit-app/SKILL.md)

That skill covers:

- **React + MUI + `@digit/lib-frontend`** (required default stack)
- `src/frontend` + `src/backend` source; sibling `frontend/` / `backend/` build outputs (pack only)
- Mounting to `#root` with `DigitThemeProvider`
- Root `manifest.json` (staged at the zip root by pack)
- Digit API access via `useDigitApiQuery` / `/proxy/digit`
- Env vars and secrets (backend Worker injection only)
- Publishing with Digit MCP (`apps` → upload zip → `publishApp` → poll)

## Packages

| Package | Role |
| --- | --- |
| [`packages/lib-common`](packages/lib-common) (`@digit/lib-common`) | Codes, result types, pure validation (no React / no `Response`) — depend directly when using a Worker |
| [`packages/lib-frontend`](packages/lib-frontend) (`@digit/lib-frontend`) | Theme, harness types, Digit/backend **hooks**, error UI |
| [`packages/lib-backend`](packages/lib-backend) (`@digit/lib-backend`) | `createHandler`, `backendPath`, `ok`/`err`, env/secrets |
| [`packages/lib-build`](packages/lib-build) (`@digit/lib-build`) | `digit-app pack` — shared Vite build + `app.zip` |

Runtime packages expose a slim root export for everyday app/Worker code. Other files
under `src/` are implementation details — do not deep-import them. Helpers use named
arguments. Runtime packages do **not** re-export each other.

Apps depend on them via `file:…` — not on private `digit-web`. With a Worker, depend on
`lib-frontend` + `lib-backend` + `lib-common`, plus `lib-build` as a devDependency.

## Example

[`examples/full-featured`](examples/full-featured) is the reference app: theme, errors, Digit
API, public API, secrets, D1 CRUD, and env config. Copy it under `examples/` and trim what
you don’t need — do not invent a new project shape.

## Publish reminder

1. Create the app in the Digit UI first (MCP cannot create apps yet)
2. Write/update `SPEC.md`, then `npm run pack -w examples/<name>`
3. `app.zip` contains `frontend/` (+ `backend/` if declared) for Digit deploy, and
   `project/` (source, SPEC, tooling, vendored libs) so a later agent can iterate without Git
4. Use the MCP publish flow documented in the skill

## License

See [LICENSE](LICENSE).
