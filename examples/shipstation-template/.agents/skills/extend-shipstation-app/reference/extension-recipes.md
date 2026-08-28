# Extension recipes

Checklists only. Look up shapes on Digit MCP / ShipStation docs MCP.

## New ShipStation endpoint

1. Confirm method + path + body on ShipStation docs MCP (V2).
2. Add a helper in `src/backend/shipstation.js` using `ssFetch`. Map 401/403 to the
   existing invalid-key message; do not put upstream bodies in errors.
3. Decrypt the key only inside the Worker (`liveConnectionWithSecret` + `decryptSecret`).
4. Expose a `/proxy/backend` route; call it with `useBackendQuery` / `useBackendMutation`.
5. Persist what you must in D1 (new migration if the shape is new).

## New Digit write

1. `graphql-schema://search/…` + `type/…` for the mutation and inputs.
2. `appPermissions` → add `key`s to `manifest.json`.
3. `useDigitApiMutation`. Filter/sort/page via API args; paginate tables.
4. Pair hook `error` with `AppErrorAlert`.

## New inbound webhook event

1. Confirm event name and signature on docs MCP.
2. If it is a new **outbound** subscription: add to `WEBHOOK_EVENTS`, store id, deregister
   on disconnect.
3. Handle on the existing `shipstation` path (or declare another slug in the manifest).
4. Verify raw bytes → enqueue job → 200. Do not do slow work in the delivery handler.

## New D1 table or column

1. Add `src/backend/migrations/0002_….sql` (never edit `0001_init.sql` after publish).
2. Keep soft-delete and FKs consistent with connection/carrier rows.
3. Never select `api_key_encrypted` into JSON.

## New UI screen

1. MUI + `DigitThemeProvider`. No vanilla CSS design system.
2. Iframe: no `window.open`, `alert`/`confirm`, clipboard-read, or device APIs. Downloads
   via `DigitHost.download` only.
3. Org-admin gating in the UI does not protect the Worker.
