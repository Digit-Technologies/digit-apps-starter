# Proxy and Digit API

Apps run on a per-app origin. The only egress the frontend CSP allows is same-origin, so
Digit data and app backends are reached through Digit-hosted proxies.

## Digit GraphQL — `DigitProxyClient`

The harness defines `window.DigitProxyClient` before loading your bundle:

```ts
declare global {
  interface Window {
    DigitProxyClient: {
      callProxy: (payload: {
        query: string;
        variables?: Record<string, unknown>;
      }) => Promise<unknown>;
    };
  }
}
```

Usage:

```ts
const result = await window.DigitProxyClient.callProxy({
  query: `
    query Items($connection: ConnectionInput) {
      items(connection: $connection) {
        nodes { id name sku }
      }
    }
  `,
  variables: { connection: { first: 10 } },
});
```

Notes:

- Credentials stay server-side (HttpOnly session cookie + scoped token in Redis)
- Your query must be covered by `manifest.permissions` ∩ the user's live permissions
- Do **not** call Digit GraphQL with a bearer token from app JS
- Do **not** invent a different proxy URL — always use `DigitProxyClient`

Under the hood this POSTs `/proxy/digit` with `credentials: 'include'` and
`X-Digit-Proxy-Client: 1`.

## App backend — `/proxy/backend`

When `manifest.backend` is set, the frontend calls the app's Cloudflare Worker through:

```ts
async function callBackend(path: string, init: RequestInit = {}) {
  const response = await fetch(`/proxy/backend${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Digit-Proxy-Client': '1',
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Backend ${response.status}`);
  }
  return response.json();
}
```

Rules:

- Path is appended after `/proxy/backend` (e.g. `/proxy/backend/greeting`)
- Always send `X-Digit-Proxy-Client: 1` and `credentials: 'include'` (CSRF)
- Paths starting with `/__` are reserved and refused
- The platform sets `X-Digit-App-Id` from the Host header — the browser cannot spoof another app's worker

## Host display settings

Optional read-only settings from Digit:

```ts
window.DigitHost?.getSettings(); // { theme?: 'light'|'dark', language?: string } | null
window.DigitHost?.onSettingsChange((settings) => { /* ... */ });
```

`data-theme` and `lang` are also set on `<html>` for CSS-only theming.

Apps using `@digit/app-theme` get light/dark sync automatically via
`DigitThemeProvider` — see [theming.md](theming.md).
