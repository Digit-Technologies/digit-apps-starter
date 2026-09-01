# Extension recipes

Checklists only. Look up shapes on Digit MCP / ShipStation docs MCP.

## New ShipStation endpoint

1. Confirm method + path + body on ShipStation docs MCP (V2).
2. Add a helper in `src/backend/shipstation.js` using `ssFetch`.
3. Decrypt the key only inside the Worker (`liveApiKey` in `sync.js`).
4. Expose a `/proxy/backend` route; call it with `useBackendQuery` / `useBackendMutation`.

## New Digit write

1. `graphql-schema://search/…` + `type/…`.
2. `appPermissions` → add `key`s to `manifest.json` (and the Digit API token used as `API_TOKEN_DIGIT`).
3. Frontend: `useDigitApiQuery` / `useDigitApiMutation`. Worker: `digitGraphql.js`.
4. Pair hook `error` with `AppErrorAlert`.

## SKU mapping (CS-04)

Override `skuForLine` in `src/backend/mappers/digitToShipStation.js`. Add a D1 map table in a new migration if SKUs are not on `customerSku` / `item.sku`.

## Faire tracking (CS-01)

Set secret `FAIRE_API_KEY`. Implement `notifyFaire` in `src/backend/channels/faire.js` against the current Faire order-shipment API. `afterDigitShipped` already calls it.

## Inbound / ShipStation-first (drop-ship)

Settings → Sync mode → ShipStation to Digit. Mapper: `shipStationToDigit.js` (bill-to company = Digit customer; ship-to = drop-ship location). Do not re-push rows with `source=shipstation`.

## Lane filter

Settings → Lane tag ID = Digit `Order.tags[].id`. Orders without that tag are skipped. Default fulfillment method **Manual** skips all pushes.

## Phase 2: restore unused `0001` settings

`shipstation_connection` still has `rate_timing`, `rate_mode`, `best_rate_strategy`, `defaults`, `add_cost_to_shipping_fees`, `auto_send_return_email`, `block_on_invalid_address`. Re-add GET/PATCH `/connection/settings` and UI only when implementing rate shop, in-app labels, or writing `Order.shippingFees` from `shipstation_order_map.shipment_cost_*`.

## Phase 2: scan verification / multi-account

Scan: Digit `pickItem` + item `scanCodeSerialNumber` in a clone UI — not this template’s queue. Multi-account: drop `idx_shipstation_connection_one_live` in a new migration; do not drop it in Phase 1.

## New inbound webhook event

1. Confirm event name and RSA-SHA256 headers on docs MCP.
2. Add to `WEBHOOK_EVENTS` in `connection.js`; disconnect must `deleteWebhook`.
3. Handle on path `shipstation`; verify raw bytes → `digitJobs.submit` → 200.

## New D1 table or column

1. Add `src/backend/migrations/0003_….sql` (never edit applied files).
2. Never select `api_key_encrypted` into JSON.

## New UI screen

1. MUI + `DigitThemeProvider`. Downloads via `DigitHost.download` only.
2. Paginate tables. No Phase 2 rate/label/fee toggles unless that phase is in scope.
