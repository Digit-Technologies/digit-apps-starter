# Examples

Each example is a self-contained Vite app that builds a Digit-publishable `frontend/`
tree (and `backend/` when needed).

**Stack:** React + MUI + [`@digit/app-theme`](../packages/digit-theme) (`DigitThemeProvider`).

| Directory | Template for |
| --- | --- |
| `hello-world/` | UI only |
| `digit-api/` | Digit GraphQL via `DigitProxyClient` |
| `env-vars/` | Worker env var injection |
| `secrets-third-party/` | Worker secret used for upstream HTTP |
| `top-customers/` | Client-side aggregation over a paginated GraphQL list |
| `sales-order-progress/` | Read-only dashboard driven by a computed GraphQL field |
| `maintenance-log/` | App-owned data via a Worker + D1 backend (no Digit permissions) |

Shared conventions (also enforced by the skill):

- Wrap UI in `DigitThemeProvider`; use MUI components
- Mount to `#root`
- Build IIFE `main.js` (classic script, not ESM module)
- Inline CSS with `vite-plugin-css-injected-by-js`
- `resolve.preserveSymlinks: true` for the `file:` theme package
- Put `manifest.json` in `public/` so Vite copies it into `frontend/`
- Zip with `frontend/` (and optional `backend/`) at the archive root
