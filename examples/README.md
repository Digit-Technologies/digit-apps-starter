# Examples

Each example is a self-contained Vite app that builds a Digit-publishable `frontend/`
tree (and `backend/` when needed).

| Directory | Template for |
| --- | --- |
| `hello-world/` | UI only |
| `digit-api/` | Digit GraphQL via `DigitProxyClient` |
| `env-vars/` | Worker env var injection |
| `secrets-third-party/` | Worker secret used for upstream HTTP |

Shared conventions (also enforced by the skill):

- Mount to `#root`
- Build IIFE `main.js` (classic script, not ESM module)
- Inline CSS with `vite-plugin-css-injected-by-js`
- Put `manifest.json` in `public/` so Vite copies it into `frontend/`
- Zip with `frontend/` (and optional `backend/`) at the archive root
