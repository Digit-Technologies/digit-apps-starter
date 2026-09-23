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
| `POST` | `/v2/shipments` | Push Sutton shipment (`create_sales_order: true`). Always includes `carrier_id` + `service_code` from the Sutton shipping-carrier → ShipStation service map. |
| `GET` | `/v2/shipments/{id}` | Writeback |
| `GET` | `/v2/shipments/external_shipment_id/{id}` | Lookup by Sutton shipment id |
| `GET` | `/v2/labels` | Poll unlabeled maps (`shipment_id` / `external_shipment_id`); `tracking_status` drives Sutton `shippingStatus` |
| `GET` | `/v2/labels/{id}` | Queue PDF download (`label_download_type=inline`) |

`POST /v2/shipments` keeps one ShipStation shipment per Sutton shipment and sends one
`packages[]` entry per Sutton pack container. Each package uses the container's gross
weight and complete dimensions when available, org defaults otherwise, and the Sutton
pack-container id as `external_package_id`. Shipment `items[]` remain shipment-level;
do not misuse customs-only `packages[].products[]` as item-to-package allocation.
Push requires a Sutton `shippingCarrierField` that reverse-maps to exactly one
ShipStation **service** through a confirmed (`manual`) map — not a carrier-level default
and not an auto-matched `fuzzy` row; that map supplies `carrier_id` and `service_code`.

## Later (not wrapped)

Address validation, return labels, in-app rate shop (`POST /v2/rates`), purchase from rate
(`POST /v2/labels/rates/{id}`), Rate Shopper one-shot.
