# Examples

[`hello-world/`](hello-world) is the minimal frontend-only example used to pre-scaffold
`apps/app` in the curated starter archive.

[`full-featured/`](full-featured) is the reference Digit app. Copy it and remove tabs /
routes you don’t need rather than inventing a new project shape.

**Stack:** React + MUI + [`@digit/lib-frontend`](../packages/lib-frontend). Workers use
[`@digit/lib-backend`](../packages/lib-backend) + [`@digit/lib-common`](../packages/lib-common)
(codes / validation — depend directly; packages do not re-export each other). Tooling:
[`@digit/lib-build`](../packages/lib-build) (`digit-app pack`).

Shared conventions (also enforced by the skill):

- Source lives under `src/frontend/` and (when needed) `src/backend/`
- Build outputs are sibling `frontend/` and `backend/` — gitignored; only in `app.zip` via pack
- Wrap UI in `DigitThemeProvider`; use MUI components
- Mount to `#root`
- Harness types come from `@digit/lib-frontend` — no local `digit.d.ts`
- Prefer `useDigitApiQuery` / `useBackendQuery` (and mutations) from `@digit/lib-frontend`
  (hooks only — pair errors with `AppErrorAlert`)
- Workers: `createHandler` + `backendPath` + `requireEnv` / `ok` / `err` from
  `lib-backend`; `AppErrorCode` / parsers from `lib-common`
- Root `manifest.json`; `digit-app pack` stages it at the zip root
- `npm run pack` → `app.zip` with root `manifest.json` + `frontend/` (+ `backend/`) for
  Digit deploy and required `project/` (source, `SPEC.md`, tooling, vendored
  `@digit/lib-*` incl. `lib-build` — not deployed)
- Do not copy Vite configs or pack scripts into each example — use `@digit/lib-build`
- Ignore `node_modules/`, `.vite/`, `*.zip`, and build folders
