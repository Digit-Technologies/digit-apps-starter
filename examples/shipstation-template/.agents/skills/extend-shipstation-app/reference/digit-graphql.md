# Digit GraphQL (shipping-adjacent)

There are **no** `shipstation*` types. Connection state is D1, not Digit.

Before adding a Digit operation:

1. `graphql-schema://search/{query}` then `graphql-schema://type/{TypeName}`
2. `appPermissions` — put each needed permission **`key`** in `manifest.json`
3. Frontend: `useDigitApiQuery` / `useDigitApiMutation`. Use connection/page args; paginate tables.

Do not dump the schema into SPEC or this file. Look it up every time — fields change.

## Names to search (not a field list)

Typical starting queries (confirm on MCP; add whatever keys those fields require):

| Intent | Search for |
| --- | --- |
| Sales orders | `Order`, `salesOrders`, line items, ship-to address |
| Digit shipments | `Shipment`, `shipments`, `createShipment`, `updateShipment` |
| Companies / contacts | company and contact types on the order |
| Invoices | invoice types if you attach shipping cost |
| Permissions | `appPermissions` for `READ_SHIPMENT` and any write keys you actually call |

- Digit GraphQL used: `currentPermissions`, `organization`, `organizationDynamicFields.shippingCarriers`,
  `shipments`, `shipment`, `orders`, `items`,
  `companies`, `generateSalesOrderPdf`, and Worker mutations for orders/shipments (`shippingCarrierFieldId`).
  Look up fields on `graphql-schema://…` before adding more.
- Queue filters `shipments(shippingStatuses: …)` using Digit statuses mapped from ShipStation
  label `tracking_status`: `unknown` → `awaiting_pickup`; `in_transit` / `delivered` / `error`
  → `shipped`. Default All is those plus `awaiting_carrier` and `awaiting_drop_off`.
  Outbound poll still uses `SHIPMENT_LIST_QUERY` with `shippingStatuses: [awaiting_carrier]`. Nested `order`
  and packed items (`packContainers.packedItems.pickedItem.orderItem`) need `READ_ORDER`,
  `READ_PACK_CONTAINER`, `READ_PICKED_ITEM`, and `READ_ITEM`.
- Outbound package mapping reads `PackContainer.container`, `packageGrossWeight`, and
  `packageLength` / `packageWidth` / `packageHeight`, including each measurement's
  `uom { name symbol type }`. V2 maps every Digit pack container to one ShipStation
  package; V1 accepts only one pack container per Digit shipment.
- `manifest.permissions` must cover every Digit field the iframe **and** `JWT_TOKEN` call.
