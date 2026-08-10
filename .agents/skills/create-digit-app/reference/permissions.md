# Permissions

## Model

1. `manifest.json` `permissions` declare the app's **ceiling**
2. At grant/refresh, Digit intersects that list with the viewing user's **live** permissions
3. The scoped token can never exceed either set

Empty `permissions: []` means the app cannot call Digit GraphQL successfully for protected
fields — fine for UI-only apps.

## Looking up permissions (required)

Digit MCP is required. Do **not** invent permission strings.

1. Call MCP tool **`appPermissions`**
2. Choose the permissions your GraphQL operations need (use descriptions to pick)
3. Put each permission’s **`key`** into `manifest.permissions` exactly as returned

Unknown strings cause publish to fail with:

```text
manifest.json "permissions" contains unknown permissions: …
```

## Tips

- Look up fields with `graphql-schema://…` first, then declare only the permissions those
  operations need
- After adding a new Digit API call, update `permissions` in the same change
- Do not copy admin-only permissions into an app unless the product explicitly needs them
  and the users who open the app hold them
