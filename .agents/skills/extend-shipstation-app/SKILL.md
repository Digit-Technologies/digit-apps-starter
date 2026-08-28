---
name: extend-shipstation-app
description: >-
  Extend the Digit ShipStation template (encrypted V2 connection, D1, inbound
  /webhooks/shipstation, Worker ssFetch). Use when working in
  examples/shipstation-template, apps scaffolded with
  npm run new-app -- <name> --from shipstation-template, or when the user
  mentions ShipStation, shipping labels, rates, tracking, carriers, or
  ShipStation webhooks in a Digit app.
---

# Extend ShipStation app

Follow **create-digit-app** first (React + MUI + `DigitThemeProvider`, iframe limits,
`manifest.json`, pack, publish). This skill is the extra layer for the ShipStation
template — do not invent a second stack or call ShipStation from the browser.

## Required MCPs

| MCP | Role | If missing |
| --- | --- | --- |
| **Digit** | GraphQL schema (`graphql-schema://index`, `type/…`, `search/…`), `appPermissions`, `apps` / publish | Stop. Ask the user to connect Digit MCP. |
| **ShipStation docs** | Endpoint and payload docs only (`https://docs.shipstation.com/mcp`) | Stop. Ask the user to connect it. Do not invent V2 paths or bodies. |

ShipStation’s MCP **does not** call `api.shipstation.com`. Runtime HTTP belongs in the
Worker via `ssFetch` in `src/backend/shipstation.js`, using the decrypted D1 API key.
Do **not** put a ShipStation API key in Cursor MCP config, `.env`, or the frontend.

Setup: [reference/mcp.md](reference/mcp.md). Digit GraphQL lookup:
[reference/digit-graphql.md](reference/digit-graphql.md).

## Hard rules

- Digit has **no** `shipstation*` GraphQL types. Connection, carriers, settings, and
  labels live in D1 (`SHIPSTATION_DB`). Look up every Digit field you use; never invent
  types or `manifest.permissions` keys — use `appPermissions`.
- New ShipStation HTTP: look up the operation on ShipStation docs MCP, then add a
  function next to the existing helpers in `shipstation.js` (all go through `ssFetch`).
  Thin path map (not schemas): [reference/shipstation-v2-map.md](reference/shipstation-v2-map.md).
- Never log or return `apiKey`, `api_key`, or `api_key_encrypted`. Do not `SELECT` the
  encrypted key into JSON responses.
- Inbound webhooks are **public**. Keep using the declared path `shipstation` (or add
  another slug in `manifest.json`, max 10). Verify over **raw** body bytes before acting;
  return 2xx within ~10s; enqueue heavier work with `digitJobs`. Do not log webhook
  bodies (addresses / tracking). Details: [reference/webhooks.md](reference/webhooks.md)
  and create-digit-app [webhooks](../create-digit-app/reference/webhooks.md) /
  [jobs](../create-digit-app/reference/jobs-and-schedules.md).
- Outbound registration: connect already POSTs `label_created_v2` and `track` when
  `PUBLIC_WEBHOOK_URL` is set. New events: MCP lookup → `createWebhook` → D1
  `shipstation_webhook` → disconnect must `deleteWebhook`.
- Org-admin in the UI (`UPDATE_ORGANIZATION`) is **not** Worker auth. Anyone who can
  open the published app can hit `/proxy/backend`.
- Sort / filter / page Digit lists via GraphQL args. Paginate tables.
- Update `SPEC.md` with **verbatim** user prompts before pack.

## Where to edit

[reference/architecture.md](reference/architecture.md) ·
[reference/backend-routes.md](reference/backend-routes.md) ·
[reference/d1.md](reference/d1.md)

Recipes: [reference/extension-recipes.md](reference/extension-recipes.md).

Do **not** treat `requirements.md` (if present) as the skill. Extend the code that
exists; look up APIs via MCP.

## Checklist

```
ShipStation extend:
- [ ] create-digit-app stack / iframe / pack rules
- [ ] Digit MCP connected; schema + appPermissions for any new Digit call
- [ ] ShipStation docs MCP connected; lookup before new ssFetch paths
- [ ] Secrets stay in Digit (APP_SECRET_ENCRYPTION_KEY); key never in UI or logs
- [ ] New D1 shape = new migration file, not an edit of 0001_init.sql
- [ ] Webhook: declared path, verify, 200 fast, jobs for slow work
- [ ] SPEC.md prompts updated
```
