# digit-apps-starter

Skills and example apps for building on the Digit Apps platform.

## Agent skill

Agents should follow:

[`.agents/skills/create-digit-app/SKILL.md`](.agents/skills/create-digit-app/SKILL.md)

That skill covers:

- **React + MUI + `@digit/app-frontend`** (required default stack)
- Vite + folder conventions (`frontend/`, optional `backend/`)
- Mounting to `#root` with `DigitThemeProvider`
- `manifest.json` schema (permissions, Cloudflare Worker / D1)
- Digit API access via `useDigitApiQuery` / `/proxy/digit`
- Env vars and secrets (backend Worker injection only)
- Publishing with Digit MCP (`apps` → upload zip → `publishApp` → poll)

## Packages

| Package | Role |
| --- | --- |
| [`packages/app-shared`](packages/app-shared) (`@digit/app-shared`) | Shared codes, results, pure validation (no React / no `Response`) |
| [`packages/app-frontend`](packages/app-frontend) (`@digit/app-frontend`) | Theme, harness types, Digit/backend hooks, error UI |
| [`packages/app-backend`](packages/app-backend) (`@digit/app-backend`) | Worker `Response` helpers, env/secrets, path, upstream `fetch` |

Each package exposes a slim root export for everyday app/Worker code. Other files
under `src/` are implementation details — do not deep-import them.

Apps depend on them via `file:…` — not on private `digit-web`. Frontend and backend
packages already pull in `@digit/app-shared`.

## Example

[`examples/full-featured`](examples/full-featured) is the reference app: theme, errors, Digit
API, public API, secrets, D1 CRUD, and env config. Copy it and trim what you don’t need.

## Publish reminder

1. Create the app in the Digit UI first (MCP cannot create apps yet)
2. `npm run build` in the example / your app
3. Zip so the archive root contains `frontend/` (and `backend/` if declared)
4. Use the MCP publish flow documented in the skill

## License

See [LICENSE](LICENSE).
