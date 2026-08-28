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

The template today only uses:

```
query ShipStationBootstrap {
  currentPermissions { key }
  organization { id }
}
```

Those fields are ungated in `appPermissions` (same class as `currentUser`) — that is why
`manifest.permissions` is `[]`. New Digit writes will not be.
