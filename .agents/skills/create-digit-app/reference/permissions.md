# Permissions

## Model

1. `manifest.json` `permissions` declare the app's **ceiling**
2. At grant/refresh, Digit intersects that list with the viewing user's **live** permissions
3. The scoped token can never exceed either set

Empty `permissions: []` means the app cannot call Digit GraphQL successfully for protected
fields — fine for UI-only apps.

## Declaring permissions

Add every permission your GraphQL operations need. Manifest strings are **SCREAMING_SNAKE_CASE**
`apiPermissions.key` values:

| App need | Permission (`key`) |
| --- | --- |
| List/read items | `READ_ITEM` |
| List inventory | `READ_INVENTORY` |
| List sales orders | `READ_ORDER` |
| List companies | `READ_COMPANY` |
| List purchase orders | `READ_PURCHASE_ORDER` |
| Read order cost info | `READ_ORDER_COST_INFO` |
| Read org profile | (often covered by base role access — confirm via schema/tools) |

Copy `key` exactly (e.g. `READ_ITEM`, `READ_ORDER_COST_INFO`). Never invent strings and
never convert formats.

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

| Field | Meaning | Use in `manifest.json`? |
| --- | --- | --- |
| `key` | SCREAMING_SNAKE_CASE (`READ_ITEM`) | **Yes — only this** |
| `description` | Human label (`Read Item`) | No — for choosing, not for the manifest |
| `value` (if present) | Legacy colon form (`read:item`) | **No — do not use** |

If MCP is unavailable, copy a known-good `key` from an existing Digit app example (e.g.
`examples/full-featured` uses `READ_ITEM`).

Unknown strings cause publish to fail with:

```text
manifest.json "permissions" contains unknown permissions: …
```

## Tips for agents

- Always copy `apiPermissions` → **`key`** into the manifest
- Keep SCREAMING_SNAKE_CASE as returned — do not rewrite to colon-delimited forms
- Start minimal — only permissions the queries/mutations actually need
- After adding a new Digit API call, update `permissions` in the same change
- Do not copy admin-only permissions into an app unless the product explicitly needs them
  and the users who open the app hold them
