# Extension recipes

Checklists only. Look up shapes on Digit MCP / ShipStation docs MCP.

## New ShipStation endpoint

1. Confirm method + path + body on ShipStation docs MCP for the API version in use
   ([v2 map](shipstation-v2-map.md), [v1 map](shipstation-v1-map.md)).
2. Add a helper in `src/backend/shipstation.js` using `ssFetch` (dispatch on
   `credentials.apiVersion`).
3. Resolve credentials only inside the Worker (`liveCredentials` in `sync.js`).
4. Expose a `/proxy/backend` route; call it with `useBackendQuery` / `useBackendMutation`.
5. Parse failures through `ssFetch` (upstream errors). `appendActivity`. UI: Alert with meaning + refetch `/sync/activity`.

## New Digit write

1. `graphql-schema://search/…` + `type/…`.
2. `appPermissions` → add `key`s to `manifest.json` (and the Digit API token used as `API_TOKEN_DIGIT`).
3. Frontend: `useDigitApiQuery` / `useDigitApiMutation`. Worker: `digitGraphql.js`.
4. Pair hook `error` with `AppErrorAlert`.
5. `appendActivity` on Worker writes; show outcome + meaning in the UI ([error-handling.md](error-handling.md)).

## SKU mapping (CS-04)

Override `skuForLine` in `src/backend/mappers/digitToShipStation.js`. Add a D1 map table in a new migration if SKUs are not on `customerSku` / `item.sku`.

## Faire tracking (CS-01)

Set secret `FAIRE_API_KEY`. Implement fulfillment POST in `src/backend/channels/faire.js`
(`faireAdapter.afterDigitShipped`). Registry runs it after Digit writeback.

## Add commerce channel (Shopify, WooCommerce, …)

See [channel-recipes.md](channel-recipes.md) and [channels.md](channels.md). Copy
`_scaffold.js`, register in `registry.js`, add secrets to `CHANNEL_SECRETS`.

## Inbound / ShipStation-first (drop-ship)

Settings → Sync mode → ShipStation to Digit. Mapper: `shipStationToDigit.js` (bill-to company = Digit customer; ship-to = drop-ship location). Import line prices from V1 `unitPrice` / V2 `unit_price`; when absent, use the matched Digit item's non-null `defaultSalesPrice`, then zero. Resolve V1 `carrierCode` or V2 `carrier_id` through `matchDigitCarrier.js` and set `shippingCarrierFieldId` before `createOrder`. ShipStation has no faithful shipping/payment terms source, so leave both unset unless an explicit org-level default is added later. Do not re-push rows with `source=shipstation`.

## Digit carrier from ShipStation

Writeback sets `shippingCarrierFieldId` via `matchDigitCarrier.js` (manual D1 map, aliases, conservative fuzzy). Unmatched carriers stay unset and log `carrier_unmapped`. Operators correct maps in Settings. Do not create Digit carrier options. Do not map SS service codes to Digit shipping class unless asked.

## Lane filter

Settings → Lane tag ID = Digit `Order.tags[].id`. Orders without that tag are skipped. Default fulfillment method **Manual** skips all pushes.

## Phase 2 leftovers on `0001`

`shipstation_connection` still has `rate_timing`, `rate_mode`, `best_rate_strategy`, `defaults`, `add_cost_to_shipping_fees`, `auto_send_return_email`, `block_on_invalid_address`. Do not re-add GET/PATCH `/connection/settings`. In-app rate shop + label purchase use `org_settings` (`0009_label_rates.sql`) instead of those unused connection columns.

## Phase 2: scan verification / multi-account

Scan: Digit `pickItem` + item `scanCodeSerialNumber` in a clone UI — not this template’s queue. Multi-account: drop `idx_shipstation_connection_one_live` in a new migration; do not drop it in Phase 1.

## New inbound webhook event

1. Confirm event name and verify scheme on docs MCP (V2 RSA-SHA256 vs V1 unsigned + token).
2. Add to `WEBHOOK_EVENTS_V2` or `WEBHOOK_EVENTS_V1` in `connection.js`; disconnect must `deleteWebhook`.
3. Handle on path `shipstation`; verify raw bytes (and query token for V1) → `digitJobs.submit` → 200.
4. `appendActivity` after the job (ids + outcome only). Activity copy should say “ShipStation”
   generically; mention V1/V2 only in connect/setup errors.

## New D1 table or column

1. Add `src/backend/migrations/0003_….sql` (never edit applied files).
2. Never select `api_key_encrypted` into JSON.
3. In scheduled or batch paths, reuse data you already listed (`pushShipment({ preloaded })`)
   and cap work per run. A Digit query per row trips the API rate limit (429).

## New UI screen

1. MUI + `DigitThemeProvider`. Downloads via `DigitHost.download` only (surface throws).
2. Paginate tables. No Phase 2 return-label or shipping-fee toggles unless that phase is in scope.
3. Outcome Alerts and activity refetch after mutations.
