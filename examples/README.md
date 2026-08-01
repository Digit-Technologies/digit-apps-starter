# Examples

[`full-featured/`](full-featured) is the reference Digit app. Copy it and remove tabs /
routes you don’t need rather than inventing a new project shape.

**Stack:** React + MUI + [`@digit/lib-frontend`](../packages/lib-frontend). Workers use
[`@digit/lib-backend`](../packages/lib-backend) + [`@digit/lib-common`](../packages/lib-common)
(codes / validation — depend directly; packages do not re-export each other).

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
- Root `manifest.json`; `build:frontend` copies it into `frontend/`
- `npm run pack` → `app.zip` with `frontend/` (+ `backend/`) for Digit deploy and
  `project/` (source, `SPEC.md`, tooling, vendored `@digit/lib-*`) for later agents
- Ignore `node_modules/`, `.vite/`, `*.zip` only — not the build folders
