# manifest.json

**Source:** keep `manifest.json` at the **app project root** (next to `package.json`) —
it is Digit publish config, not a Vite static asset.

**Publish zip:** required at the **zip root**, sibling of `frontend/` and `backend/`.
`digit-app pack` (`@digit/lib-build`) stages the root file there. Validated at publish
time. Not uploaded to the serving bucket as-is — Digit snapshots it onto the publish row
and derives `active.json` / bundle assets from it.

## Schema

```ts
type AppManifest = {
  permissions: DigitPermission[]; // SCREAMING_SNAKE_CASE, e.g. "READ_ITEM"
  backend?: {
    kind: 'cloudflare-worker';    // the runtime; only cloudflare-worker today
    bindings?: Record<string, 'database'>; // BINDING_NAME → type, e.g. { MY_APP_DB: "database" }
    schedules?: {
      name: string;        // lowercase [a-z0-9-], max 32, unique
      everySeconds: number; // 300–86400
      payload?: unknown;   // ≤4KB JSON, passed to every tick
    }[];                   // max 5; see reference/jobs-and-schedules.md
  };
};
```

## Rules

- `permissions` must be an array of known Digit permission **`key`** strings
  (SCREAMING_SNAKE_CASE, e.g. `READ_ITEM`) — not colon-delimited legacy values
- If `backend` is present, the zip **must** include `backend/index.js`
- If the zip includes `backend/` files but the manifest has no `backend` block → reject
- `bindings` maps `BINDING_NAME` (`^[A-Z][A-Z0-9_]{0,63}$`) to a type; `"database"` (a
  platform-provisioned D1) is the only supported type today
- Binding names must not start with `DIGIT_` — reserved for platform bindings
- At most **one** `database` binding per app for now
- Optional `backend/migrations/*.sql` (flat — no nested dirs) requires a `database` binding
- Optional `backend.schedules` (recurring background runs): name `[a-z0-9-]{1,32}` unique,
  `everySeconds` 300–86400, payload ≤4KB, max 5 — handled via `createHandler({ jobs })`;
  publishing replaces the set wholesale (no `schedules` = clears them)
- `frontend/index.js` must exist; `frontend/index.html` and `frontend/loader.js` are
  harness-reserved names your bundle may not contain

## Examples

Frontend-only:

```json
{
  "permissions": []
}
```

Digit API + Worker + D1 + an hourly schedule:

```json
{
  "permissions": ["READ_ITEM", "READ_INVENTORY"],
  "backend": {
    "kind": "cloudflare-worker",
    "bindings": { "STOCK_HELPER_DB": "database" },
    "schedules": [{ "name": "refresh-stock", "everySeconds": 3600 }]
  }
}
```

## Zip layout

Produced by `digit-app pack`. Upload that zip **unchanged**.

```
manifest.json            # zip root — Digit publish config
frontend/                # Digit deploy — required
  index.js               # the entry, by convention
backend/                 # Digit deploy — when manifest.backend is set
  index.js               # single-file Worker ESM, by convention
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
