# Proxy and Digit API

Apps run on a per-app origin. The only egress the frontend CSP allows is same-origin, so
Digit data and app backends are reached through Digit-hosted proxies.

Prefer the React hooks from `@digit/lib-frontend` — they wrap the harness client and
normalize errors for `AppErrorAlert`. The package’s public data API is **hooks only**
(imperative fetch helpers stay private).

## Look up the GraphQL schema (required)

Digit MCP is required. When writing or changing Digit GraphQL operations, use these MCP
**resources** — do **not** invent field or type names, and do **not** load the full schema
into context:

1. `graphql-schema://index` — compact list of queries, mutations, and type names
2. `graphql-schema://type/{TypeName}` — that type’s SDL (e.g. `graphql-schema://type/Item`)
3. `graphql-schema://search/{query}` — search (optional `?limit=1-50`, default 25), then
   fetch matching type URIs

This is the public API schema (same surface API tokens can introspect). Pair schema lookup
with MCP **`appPermissions`** so `manifest.permissions` covers the operations you call —
see [permissions.md](permissions.md).

## Hooks

```ts
import {
  AppErrorAlert,
  useDigitApiQuery,
  useBackendQuery,
  useBackendMutation,
} from '@digit/lib-frontend';

const { data, error, loading, refetch } = useDigitApiQuery({
  query: `
    query Items($connection: ConnectionInput) {
      items(connection: $connection) {
        nodes { id name sku }
      }
    }
  `,
  variables: { connection: { first: 10 } },
});

if (error) {
  // <AppErrorAlert error={error} onRetry={() => void refetch()} />
}

const notes = useBackendQuery<{ notes: Note[] }>({ path: '/notes' });
const [mutateNote] = useBackendMutation();
await mutateNote({ path: '/notes', method: 'POST', body: { title: 'Hi' } });
```

Confirm root fields and selection sets against `graphql-schema://…` before shipping.
Types for `window.DigitHost` are exported from `@digit/lib-frontend` (`DigitHost`,
`DigitHostSettings`). Prefer the hooks over calling `window.DigitProxyClient` yourself.

## Sort, filter, and pagination

Prefer API (GraphQL or backend) inputs for sorting, filtering, and paging when the schema
or route supports them. Do not load an entire collection into the browser to sort/filter
locally if the field accepts those args — look them up on `graphql-schema://type/…`.

When the UI is a table (or any multi-row list that can grow), paginate it: pass
`connection` / page args (e.g. `first` + `after`, or page size + cursor) and wire
next/previous (or equivalent) controls. Unbounded `nodes` dumps are not acceptable for
tables.

## Digit GraphQL API

`useDigitApiQuery` / `useDigitApiMutation` POST `/proxy/digit` with
`credentials: 'include'` and `X-Digit-Proxy-Client: 1`.

- Credentials stay server-side (HttpOnly session cookie + scoped token in Redis)
- Your query must be covered by `manifest.permissions` ∩ the user's live permissions
- Do **not** call Digit GraphQL with a bearer token from app JS
- Do **not** invent a different proxy URL

## App backend

When `manifest.backend` is set, `useBackendQuery` / `useBackendMutation` hit
`/proxy/backend/...`. Rules:

- Always go through these helpers so `X-Digit-Proxy-Client` is set
- Paths starting with `/__` are reserved and refused
- The platform sets `X-Digit-App-Id` from the Host header — the browser cannot spoof another app's worker
- Pair with `@digit/lib-backend` on the Worker (`createHandler`, `backendPath`, `ok` / `err`)

```js
import { AppErrorCode } from '@digit/lib-common';
import { backendPath, createHandler, ok, err, requireEnv } from '@digit/lib-backend';

export default createHandler({
  fetch: async ({ request, env }) => {
    const path = backendPath(request);
    const { method } = request;

    if (method === 'GET' && path === '/greeting') {
      return ok({ data: { message: requireEnv({ env, key: 'WELCOME_MESSAGE' }) } });
    }
    if (method === 'PUT' && path.startsWith('/notes/')) {
      return ok({ data: { id: path.slice('/notes/'.length) } });
    }

    return err({ code: AppErrorCode.NOT_FOUND, message: 'Not found.', status: 404 });
  },
});
```

Import codes / validation from `@digit/lib-common`; Worker Response helpers from
`@digit/lib-backend` (no re-exports between packages).

## Host display settings

```ts
import type { DigitHostSettings } from '@digit/lib-frontend';

window.DigitHost?.getSettings(); // DigitHostSettings | null
window.DigitHost?.onSettingsChange((settings) => { /* ... */ });
```

`data-theme` and `lang` are also set on `<html>`. Apps using `@digit/lib-frontend` get
light/dark sync automatically via `DigitThemeProvider` — see [theming.md](theming.md).
