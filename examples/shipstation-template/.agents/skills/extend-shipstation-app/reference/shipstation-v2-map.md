# ShipStation API v2 — thin map

Base URL: `https://api.shipstation.com`. Auth: header `api-key` (see `headers()` in
`src/backend/shipstation.js`). **V2 only.**

This is an index, not OpenAPI. Confirm request/response bodies on ShipStation docs MCP
before implementing. Do not copy V1 (`ssapi.shipstation.com`) or ShipEngine hosts.

## Already wrapped in `shipstation.js`

| Method | Path | Used for | Extend |
| --- | --- | --- | --- |
| `GET` | `/v2/carriers` | Validate API key on connect; seed carrier sync | `listCarriers` |
| `GET` | `/v2/carriers/{carrierId}/services` | Fill services when the carrier list has none | `listCarrierServices` |
| `POST` | `/v2/environment/webhooks` | Register inbound URL | `createWebhook` |
| `DELETE` | `/v2/environment/webhooks/{webhookId}` | Disconnect | `deleteWebhook` |

## Likely extensions (lookup before coding)

Confirm exact paths and bodies via MCP. Add a named helper that calls `ssFetch` — do not
`fetch` ShipStation from `connection.js` or the frontend.

| Area | Why it shows up in this template |
| --- | --- |
| Rates | Settings already store `rate_timing`, `rate_mode`, `best_rate_strategy` |
| Labels (purchase / void / PDF) | `shipment_label` table is an audit stub |
| Tracking | Connect registers the `track` webhook event |
| Address validation | Settings store `block_on_invalid_address` |
| Webhook event list | New events besides `label_created_v2` and `track` |

If docs MCP is unavailable, see [mcp.md](mcp.md) (live OpenAPI URL, do not commit it).
