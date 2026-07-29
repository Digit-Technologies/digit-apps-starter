# digit-apps-starter

Skills and example apps for building on the Digit Apps platform.

## Agent skill

Agents should follow:

[`.agents/skills/create-digit-app/SKILL.md`](.agents/skills/create-digit-app/SKILL.md)

That skill covers:

- Vite + folder conventions (`frontend/`, optional `backend/`)
- Mounting to `#root`
- `manifest.json` schema (permissions, Cloudflare Worker / D1)
- Digit API access via `DigitProxyClient` / `/proxy/digit`
- Env vars and secrets (backend Worker injection only)
- Publishing with Digit MCP (`apps` → upload zip → `publishApp` → poll)

## Examples

| Example | What it shows |
| --- | --- |
| [`examples/hello-world`](examples/hello-world) | Minimal UI-only app |
| [`examples/digit-api`](examples/digit-api) | Digit GraphQL via `DigitProxyClient` |
| [`examples/env-vars`](examples/env-vars) | Backend reads an app env var |
| [`examples/secrets-third-party`](examples/secrets-third-party) | Backend uses a secret for a third-party API |

Copy the closest example, then adapt. Do not invent a different layout.

## Publish reminder

1. Create the app in the Digit UI first (MCP cannot create apps yet)
2. `npm run build` in the example / your app
3. Zip so the archive root contains `frontend/` (and `backend/` if declared)
4. Use the MCP publish flow documented in the skill

## License

See [LICENSE](LICENSE).
