# ShipStation API v1 — thin map

Base URL: `https://ssapi.shipstation.com`. Auth: `Authorization: Basic` (base64 of
`SHIPSTATION_API_KEY:SHIPSTATION_API_SECRET`).

Used when **both** `SHIPSTATION_API_KEY` and `SHIPSTATION_API_SECRET` are set.
Confirm request/response bodies on ShipStation docs MCP (V1) before changing helpers.
Do not call `ssapi.shipstation.com` from the browser.

V2 paths: [shipstation-v2-map.md](shipstation-v2-map.md). Dispatch lives in
`src/backend/shipstation.js`; HTTP is `ssFetch` in `shipstationFetch.js`.

## Wrapped in `shipstation.js`

| Method | Path | Used for |
| --- | --- | --- |
| `GET` | `/carriers` | Validate credentials; carrier sync |
| `GET` | `/carriers/listservices?carrierCode=` | Services when the carrier list has none |
| `POST` | `/webhooks/subscribe` | Register inbound URL (`target_url`, `event`, `friendly_name`) |
| `DELETE` | `/webhooks/{id}` | Disconnect |
| `POST` | `/orders/createorder` | Push Digit shipment (V1 order; `orderKey` = Digit shipment id) |
| `GET` | `/orders/{orderId}` | Writeback / inbound |
| `GET` | `/orders?orderNumber=` | Lookup by Digit document number / order key |
| `GET` | `/orders?...` | Inbound poll |
| `GET` | `resource_url` | Thin webhook payloads (SSRF: `ssapi.shipstation.com` also allowed) |

V1 has no standalone label GET. Label/ship events must fetch `resource_url` (or `GET /orders/{id}`).

D1 `ss_shipment_id` stores the V1 numeric `orderId` (stringified). Sync normalizes V1 orders
through `normalizeSsRecord` before writeback/import.

## Webhook events registered on connect

`SHIP_NOTIFY`, `ORDER_NOTIFY`, `FULFILLMENT_SHIPPED`.

V1 webhooks are **unsigned**. Connect appends `?token=` from `SHIPSTATION_WEBHOOK_TOKEN` to
`PUBLIC_WEBHOOK_URL`. Inbound verify is a timing-safe compare of that query token when
ShipEngine RSA headers are absent. Thin body: `{ resource_url, resource_type }` — the job
GETs `resource_url` with live credentials.

If `PUBLIC_WEBHOOK_URL` is set, V1 connect **requires** `SHIPSTATION_WEBHOOK_TOKEN`.
