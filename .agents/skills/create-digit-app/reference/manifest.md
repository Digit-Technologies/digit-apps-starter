# manifest.json

**Source:** keep `manifest.json` at the **app project root** (next to `package.json`) —
it is Digit publish config, not a Vite static asset.

**Publish zip:** required at `frontend/manifest.json`. `build:frontend` should copy the
root file into `frontend/` (see `examples/full-featured`). Validated at publish time.
Not uploaded to the serving bucket as-is — Digit snapshots it onto the publish row and
derives `active.json` / bundle assets from it.

## Schema

```ts
type AppManifest = {
  name: string;                 // non-empty
  entryFile: string;            // must end in .js; must exist under frontend/
  permissions: DigitPermission[]; // SCREAMING_SNAKE_CASE, e.g. "READ_ITEM"
  backend?: {
    kind: 'cloudflare-worker';
    d1?: { binding: string };   // UPPER_SNAKE_CASE, e.g. "MY_APP_DB"
    compatibilityFlags?: string[];
  };
};
```

## Rules

- `entryFile` must be a `.js` file present under `frontend/`
- `entryFile` must **not** be `index.html` or `loader.js` (harness-reserved)
- `permissions` must be an array of known Digit permission strings
- If `backend` is present, the zip **must** include `backend/worker.js`
- If the zip includes `backend/` files but the manifest has no `backend` block → reject
- `backend.d1.binding` must match `^[A-Z][A-Z0-9_]{0,63}$`
- Optional `backend/migrations/*.sql` (flat — no nested dirs) when using D1

## Examples

Frontend-only:

```json
{
  "name": "Hello World",
  "entryFile": "main.js",
  "permissions": []
}
```

Digit API + Worker + D1:

```json
{
  "name": "Stock Helper",
  "entryFile": "main.js",
  "permissions": ["READ_ITEM", "READ_INVENTORY"],
  "backend": {
    "kind": "cloudflare-worker",
    "d1": { "binding": "STOCK_HELPER_DB" }
  }
}
```

## Zip layout

```
frontend/
  manifest.json
  main.js
  …other assets…
backend/                 # only if manifest.backend is set
  worker.js
  migrations/
    0001_init.sql
```

Max zip size: **10MB**.
