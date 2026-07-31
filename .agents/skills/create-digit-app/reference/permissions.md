# Permissions

## Model

1. `manifest.json` `permissions` declare the app's **ceiling**
2. At grant/refresh, Digit intersects that list with the viewing user's **live** permissions
3. The scoped token can never exceed either set

Empty `permissions: []` means the app cannot call Digit GraphQL successfully for protected
fields — fine for UI-only apps.

## Declaring permissions

Add every permission your GraphQL operations need. Examples:

| App need | Permission strings |
| --- | --- |
| List/read items | `READ_ITEM` |
| List inventory | `READ_INVENTORY` |
| List sales orders | `READ_ORDER` |
| List companies | `READ_COMPANY` |
| List purchase orders | `READ_PURCHASE_ORDER` |
| Read order cost info | `READ_ORDER_COST_INFO` |
| Read org profile | (often covered by base role access — confirm via schema/tools) |

Use the exact SCREAMING_SNAKE_CASE strings (e.g. `READ_ITEM`, `READ_ORDER_COST_INFO`),
**not** GraphQL field names.

## Looking up permissions (required when connected)

Use Digit MCP — do **not** invent permission strings. Call the MCP tool **`apiPermissions`**
and put **`key`** into `manifest.json`. Equivalent GraphQL:

```graphql
query AppPermissionValues {
  apiPermissions {
    key
    description
  }
}
```

| Field | Meaning | Use in apps? |
| --- | --- | --- |
| `key` | SCREAMING_SNAKE_CASE enum (`READ_ITEM`) | **Yes — this is what `manifest.json` needs** |
| `description` | Human label (`Read Item`) | Optional, for choosing the right permission |

The GraphQL schema resource `graphql-schema://type/Permission` documents these fields; the
`apiPermissions` tool returns the live catalog.

If MCP is unavailable, copy a known-good `key` from an existing Digit app example.
Unknown strings cause publish to fail with:

```text
manifest.json "permissions" contains unknown permissions: …
```

## Tips for agents

- Always copy `apiPermissions` → `key` into the manifest
- Start minimal — only permissions the queries/mutations actually need
- After adding a new Digit API call, update `permissions` in the same change
- Do not copy admin-only permissions into an app unless the product explicitly needs them
  and the users who open the app hold them
