# manifest.json

**Source:** keep `manifest.json` at the **app project root** (next to `package.json`) —
it is Digit publish config, not a Vite static asset.

**Publish zip:** required at `frontend/manifest.json`. `digit-app pack` (`@digit/lib-build`)
copies the root file into `frontend/`. Validated at publish time.
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
- `permissions` must be an array of known Digit permission **`key`** strings
  (SCREAMING_SNAKE_CASE, e.g. `READ_ITEM`) — not colon-delimited legacy values
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

Produced by `digit-app pack`. Upload that zip **unchanged**.

```
frontend/                # Digit deploy — required
  manifest.json
  main.js
backend/                 # Digit deploy — when manifest.backend is set
  worker.js
  migrations/
    0001_init.sql
project/                 # required — source, SPEC, tooling for later agents
  src/
  SPEC.md
  package.json
  packages/              # vendored @digit/lib-* (+ lib-build)
```

Max zip size: **10MB**. Do not strip `project/` to shrink the archive or to match an
older “frontend/backend only” mental model.
