# Examples

[`full-featured/`](full-featured) is the reference Digit app. Copy it and remove tabs /
routes you don’t need rather than inventing a new project shape.

**Stack:** React + MUI + [`@digit/app-frontend`](../packages/app-frontend). Workers use
[`@digit/app-backend`](../packages/app-backend). Shared codes / results / validation live
in [`@digit/app-shared`](../packages/app-shared).

Shared conventions (also enforced by the skill):

- Wrap UI in `DigitThemeProvider`; use MUI components
- Mount to `#root`
- Harness types come from `@digit/app-frontend` — no local `digit.d.ts`
- Prefer `useDigitApiQuery` / `useBackendQuery` (and mutations) from `@digit/app-frontend`
- Build IIFE `main.js` via `vite.frontend.config.ts` (`npm run build:frontend`)
- Bundle the Worker with `vite.backend.config.ts` (`npm run build:backend`) when shipping a backend
- Inline CSS with `vite-plugin-css-injected-by-js`
- `resolve.preserveSymlinks: true` for `file:` packages
- Put `manifest.json` in `public/` so Vite copies it into `frontend/`
- Zip with `frontend/` (and optional `backend/`) at the archive root
