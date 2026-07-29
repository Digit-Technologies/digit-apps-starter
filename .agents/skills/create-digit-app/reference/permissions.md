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
| List/read items | `read:item` |
| List inventory | `read:inventory` |
| List sales orders | `read:order` |
| List companies | `read:company` |
| List purchase orders | `read:purchaseOrder` |
| Read org profile | (often covered by base role access — confirm via schema/tools) |

Use the exact colon-delimited strings (e.g. `read:item`), **not** GraphQL enum names
(`READ_ITEM`) and **not** GraphQL field names.

## Looking up permissions (required when connected)

Use Digit MCP — do **not** invent strings or convert screaming-snake enum names yourself
(that conversion is lossy: `READ_ITEM_COST_INFO` is `read:item:costInfo`, not
`read:item:cost:info`).

Call the MCP tool **`apiPermissions`** and put **`value`** into `manifest.json`. Equivalent
GraphQL:

```graphql
query AppPermissionValues {
  apiPermissions {
    key
    value
    description
  }
}
```

| Field | Meaning | Use in apps? |
| --- | --- | --- |
| `value` | Colon-delimited string (`read:item`) | **Yes — this is what `manifest.json` needs** |
| `key` | GraphQL enum (`READ_ITEM`) | No — schema/API-token inputs only |
| `description` | Human label (`Read Item`) | Optional, for choosing the right permission |

The GraphQL schema resource `graphql-schema://type/Permission` documents these fields; the
`apiPermissions` tool returns the live catalog.

If MCP is unavailable, copy a known-good `value` from an existing Digit app example.
Unknown strings cause publish to fail with:

```text
manifest.json "permissions" contains unknown permissions: …
```

## Tips for agents

- Always copy `apiPermissions` → `value` into the manifest
- Start minimal — only permissions the queries/mutations actually need
- After adding a new Digit API call, update `permissions` in the same change
- Do not copy admin-only permissions into an app unless the product explicitly needs them
  and the users who open the app hold them
