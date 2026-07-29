# Backend env vars and secrets

Env vars and secrets are configured on the **app record in Digit** (UI today; MCP manage
tools not live yet). They are **injected into the app's Cloudflare Worker**, not into the
frontend bundle.

## Key rules

- Keys: `UPPER_SNAKE_CASE`, pattern `^[A-Z][A-Z0-9_]{0,63}$`
- Keys must be unique across env vars **and** secrets for an app
- Values max 4096 bytes
- Secrets are write-only in the API (owners see keys, not values)
- Frontend must never hard-code secret values

## Worker access

In `backend/worker.js`, read bindings from the Worker `env` object:

```js
export default {
  async fetch(request, env) {
    const apiBase = env.API_BASE_URL;     // env var
    const apiKey = env.THIRD_PARTY_API_KEY; // secret
    // ...
  },
};
```

D1 (when declared in the manifest) appears under the binding name you chose:

```js
await env.MY_APP_DB.prepare('SELECT 1').first();
```

## Frontend pattern

Frontend calls the backend proxy; the Worker uses env/secrets server-side:

```ts
// frontend
const data = await fetch('/proxy/backend/external-status', {
  credentials: 'include',
  headers: { 'X-Digit-Proxy-Client': '1' },
}).then((r) => r.json());
```

```js
// backend/worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/external-status') {
      const res = await fetch(`${env.API_BASE_URL}/status`, {
        headers: { Authorization: `Bearer ${env.THIRD_PARTY_API_KEY}` },
      });
      return Response.json(await res.json());
    }
    return new Response('Not found', { status: 404 });
  },
};
```

## When you need a backend

| Situation | Backend required? |
| --- | --- |
| Pure UI | No |
| Digit GraphQL via `DigitProxyClient` | No |
| Read non-secret config from Digit app settings | Yes |
| Call third-party APIs with secrets | Yes |
| App-own persistence (D1) | Yes (`backend.d1`) |

## Setup for users

1. Create the app in Digit
2. Set env vars / secrets on the app in Digit
3. Publish a bundle whose manifest declares `backend.kind: "cloudflare-worker"`
4. Ship `backend/worker.js` that reads those keys from `env`
