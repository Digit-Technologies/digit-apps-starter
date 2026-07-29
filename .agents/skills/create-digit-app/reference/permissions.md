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

Use the exact `resource:action` strings (e.g. `read:item`), not GraphQL field names.

## Staying current

Prefer a live lookup when connected:

- GraphQL `apiPermissions` — grantable permission keys + descriptions
- GraphQL `currentPermissions` — what the current user/token holds

If those are unavailable, use a known-good string from an existing Digit app or from
`DigitPermissions` in digit-api (`read:item`, `read:order`, …). Unknown strings cause
publish to fail with:

```text
manifest.json "permissions" contains unknown permissions: …
```

## Tips for agents

- Start minimal — only permissions the queries/mutations actually need
- After adding a new Digit API call, update `permissions` in the same change
- Do not copy admin-only permissions into an app unless the product explicitly needs them
  and the users who open the app hold them
