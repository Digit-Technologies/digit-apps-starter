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
| `POST` | `/orders/createorder` | Push Digit shipment (V1 order; `orderKey` = Digit shipment id). Always includes `carrierCode` + `serviceCode` from the Digit shipping-carrier → ShipStation service map. |
| `GET` | `/orders/{orderId}` | Writeback / unlabeled-map poll |
| `GET` | `/orders?orderNumber=` | Lookup by Digit document number / order key |

D1 `ss_shipment_id` stores the V1 numeric `orderId` (stringified). Sync normalizes V1 orders
through `normalizeSsRecord` before writeback.

V1 exposes only one order-level `packageCode`, `weight`, and `dimensions` object. A Digit
shipment with one pack container maps that container into those fields. A shipment with
multiple pack containers is ineligible: tell the operator to create one Digit shipment
per container or disconnect and reconnect with V2 credentials.

Push requires a Digit `shippingCarrierField` that reverse-maps to exactly one ShipStation
**service** through a confirmed (`manual`) map; that map supplies `carrierCode` and
`serviceCode` on createorder.

## Not wrapped

`POST /shipments/getrates`, `POST /orders/createlabelfororder`.
