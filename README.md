# digit-apps-starter

Skills and example apps for building on the Digit Apps platform.

## Agent skill

Agents should follow:

[`.agents/skills/create-digit-app/SKILL.md`](.agents/skills/create-digit-app/SKILL.md)

That skill covers:

- **React + MUI + `@digit/app-theme`** (required default stack)
- Vite + folder conventions (`frontend/`, optional `backend/`)
- Mounting to `#root` with `DigitThemeProvider`
- `manifest.json` schema (permissions, Cloudflare Worker / D1)
- Digit API access via `DigitProxyClient` / `/proxy/digit`
- Env vars and secrets (backend Worker injection only)
- Publishing with Digit MCP (`apps` → upload zip → `publishApp` → poll)

## Theme package

[`packages/digit-theme`](packages/digit-theme) (`@digit/app-theme`) is a public
snapshot of Digit’s MUI theme. Apps depend on it via `file:…` — not on private
`digit-web`.

## Examples

| Example | What it shows |
| --- | --- |
| [`examples/hello-world`](examples/hello-world) | Minimal UI-only React + MUI app |
| [`examples/digit-api`](examples/digit-api) | Digit GraphQL via `DigitProxyClient` |
| [`examples/env-vars`](examples/env-vars) | Backend reads an app env var |
| [`examples/secrets-third-party`](examples/secrets-third-party) | Backend uses a secret for a third-party API |
| [`examples/top-customers`](examples/top-customers) | Aggregates a paginated GraphQL list client-side |
| [`examples/sales-order-progress`](examples/sales-order-progress) | Read-only dashboard driven by a computed GraphQL field |
| [`examples/maintenance-log`](examples/maintenance-log) | App-owned data via a Worker + D1 backend, no Digit permissions |

Copy the closest example, then adapt. Do not invent a different layout or styling stack.

## Publish reminder

1. Create the app in the Digit UI first (MCP cannot create apps yet)
2. `npm run build` in the example / your app
3. Zip so the archive root contains `frontend/` (and `backend/` if declared)
4. Use the MCP publish flow documented in the skill

## License

See [LICENSE](LICENSE).
