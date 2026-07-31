# Proxy and Digit API

Apps run on a per-app origin. The only egress the frontend CSP allows is same-origin, so
Digit data and app backends are reached through Digit-hosted proxies.

Prefer the React hooks from `@digit/app-frontend` — they wrap the harness client and
normalize errors for `AppErrorAlert`:

```ts
import {
  AppErrorAlert,
  useDigitApiQuery,
  useBackendQuery,
  useBackendMutation,
} from '@digit/app-frontend';

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

Types for `window.DigitHost` are exported from the same package (`DigitHost`,
`DigitHostSettings`). Importing `@digit/app-frontend` augments `Window` — do not
maintain a local `digit.d.ts`. Prefer the hooks over calling `window.DigitProxyClient`
yourself.

## Digit GraphQL API

`useDigitApiQuery` / `useDigitApiMutation` use the harness proxy client, which POSTs
`/proxy/digit` with `credentials: 'include'` and `X-Digit-Proxy-Client: 1`.

Notes:

- Credentials stay server-side (HttpOnly session cookie + scoped token in Redis)
- Your query must be covered by `manifest.permissions` ∩ the user's live permissions
- Do **not** call Digit GraphQL with a bearer token from app JS
- Do **not** invent a different proxy URL

## App backend

When `manifest.backend` is set, `useBackendQuery` / `useBackendMutation` hit
`/proxy/backend/...`. Rules:

- Always go through these helpers (or the harness client) so `X-Digit-Proxy-Client` is set
- Paths starting with `/__` are reserved and refused
- The platform sets `X-Digit-App-Id` from the Host header — the browser cannot spoof another app's worker
- Pair with `@digit/app-backend` on the Worker (`ok` / `err` result responses)

## Host display settings

```ts
import type { DigitHostSettings } from '@digit/app-frontend';

window.DigitHost?.getSettings(); // DigitHostSettings | null
window.DigitHost?.onSettingsChange((settings) => { /* ... */ });
```

`data-theme` and `lang` are also set on `<html>` for CSS-only theming.

Apps using `@digit/app-frontend` get light/dark sync automatically via
`DigitThemeProvider` — see [theming.md](theming.md).
