# ShipStation API v2 — thin map

Base URL: `https://api.shipstation.com`. Auth: header `api-key`. Used when
`SHIPSTATION_API_KEY` is set and `SHIPSTATION_API_SECRET` is **not**.

V1 paths: [shipstation-v1-map.md](shipstation-v1-map.md).

Confirm request/response bodies on ShipStation docs MCP before changing helpers.

## Wrapped in `shipstation.js`

| Method | Path | Used for |
| --- | --- | --- |
| `GET` | `/v2/carriers` | Validate API key; carrier sync |
| `GET` | `/v2/carriers/{id}/services` | Services when the carrier list has none |
| `POST` | `/v2/environment/webhooks` | Register inbound URL |
| `DELETE` | `/v2/environment/webhooks/{id}` | Disconnect |
| `POST` | `/v2/shipments` | Push Digit SO (`create_sales_order: true`) |
| `GET` | `/v2/shipments/{id}` | Writeback / inbound |
| `GET` | `/v2/shipments/external_shipment_id/{id}` | Lookup by Digit order id |
| `GET` | `/v2/shipments` | Inbound poll |
| `GET` | `/v2/labels/{id}` | Label created webhook |
| `GET` | resource_url | Thin webhook payloads (SSRF: `api.shipstation.com` / `api.shipengine.com` / `ssapi.shipstation.com`) |

## Webhook events registered on connect

`label_created_v2`, `track`, `fulfillment_shipped_v2`, `shipment_created_v2`, `sales_orders_imported`.

Inbound verify: RSA-SHA256 headers `x-shipengine-rsa-sha256-*` + `x-shipengine-timestamp` against JWKS (`/jwks` on those hosts). Not HMAC `verifyWebhookSignature`.

## Phase 2 (not wrapped)

Rates, `POST /v2/labels`, address validation, return labels. Do not add UI for them in Phase 1.
