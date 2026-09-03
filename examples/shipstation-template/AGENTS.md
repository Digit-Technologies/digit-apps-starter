# Agent notes (ShipStation template)

This template’s ShipStation skill lives **here**, not in the starter’s shared
`.agents/skills/` (that path is create-digit-app only).

Read before changing this app:

- [create-digit-app](../../.agents/skills/create-digit-app/SKILL.md) — Digit stack, iframe, pack, publish
- [extend-shipstation-app](.agents/skills/extend-shipstation-app/SKILL.md) — this template

`npm run new-app -- <name> --from shipstation-template` copies this file and
`.agents/skills/extend-shipstation-app/` into `apps/<name>/`. create-digit-app stays
at the **repo root**.

## Required MCPs

- **Digit MCP** — GraphQL schema, `appPermissions`, publish. Do not invent types or
  permission keys.
- **ShipStation docs MCP** (`https://docs.shipstation.com/mcp`) — endpoint docs only.
  It does not call ShipStation. Implement HTTP in `src/backend/shipstationFetch.js`
  (`ssFetch`) via the facade in `src/backend/shipstation.js`.

If either MCP is missing, stop and ask the user to connect it. Never put an API key in
MCP config or the frontend.

## Do

- Extend `ssFetch` / the facade for new ShipStation calls; keep secrets in Digit / D1.
- **Credential rule:** `SHIPSTATION_API_KEY` alone → V2 (`api.shipstation.com`);
  key + `SHIPSTATION_API_SECRET` → V1 (`ssapi.shipstation.com` Basic auth). Persist
  `api_version` on connect. Switching versions requires disconnect and reconnect.
- V1 + `PUBLIC_WEBHOOK_URL` requires `SHIPSTATION_WEBHOOK_TOKEN` (query `token=`).
- Declare webhook paths in `manifest.json`; verify inbound bodies before acting
  (V2 RSA-SHA256, else V1 token).
- Add D1 changes as a new migration file.
- Update `SPEC.md` with verbatim prompts.
- Follow [error-handling.md](.agents/skills/extend-shipstation-app/reference/error-handling.md)
  (activity log, outcome + meaning, no silent skips).

## Do not

- Call `api.shipstation.com` or `ssapi.shipstation.com` from the browser.
- Log or return API keys, secrets, or `api_key_encrypted`.
- Guess webhook HMAC schemes (V2 is RSA-SHA256; V1 is the webhook token, not HMAC).
- Mix V1 and V2 on one live connection without disconnect/reconnect.
- Treat `requirements.md` as the implementation spec if it is present.
