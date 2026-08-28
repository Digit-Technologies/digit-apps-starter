# Agent notes (ShipStation template)

Read these skills before changing this app:

- [`.agents/skills/create-digit-app/SKILL.md`](../../.agents/skills/create-digit-app/SKILL.md)
- [`.agents/skills/extend-shipstation-app/SKILL.md`](../../.agents/skills/extend-shipstation-app/SKILL.md)

After `npm run new-app -- <name> --from shipstation-template`, those paths are still at
the **repo root** (`.agents/skills/…`). This file is copied into `apps/<name>/`.

## Required MCPs

- **Digit MCP** — GraphQL schema, `appPermissions`, publish. Do not invent types or
  permission keys.
- **ShipStation docs MCP** (`https://docs.shipstation.com/mcp`) — endpoint docs only.
  It does not call ShipStation. Implement HTTP in `src/backend/shipstation.js` (`ssFetch`).

If either MCP is missing, stop and ask the user to connect it. Never put an API key in
MCP config or the frontend.

## Do

- Extend `ssFetch` for new ShipStation calls; keep secrets in Digit / D1.
- Declare webhook paths in `manifest.json`; verify inbound bodies before acting.
- Add D1 changes as a new migration file.
- Update `SPEC.md` with verbatim prompts.

## Do not

- Call `api.shipstation.com` from the browser.
- Log or return API keys or `api_key_encrypted`.
- Use ShipStation V1 (`ssapi.shipstation.com`) or guess webhook HMAC schemes.
- Treat `requirements.md` as the implementation spec if it is present.
