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

Prefer `@digit/lib-backend`: wrap with `createHandler`, read bindings with `requireEnv`
(or `optionalEnv` when absence is a valid branch). Missing required keys become structured
`{ ok: false, error }` responses — do not read `env.KEY` ad hoc and return plain text.

```js
import { AppErrorCode } from '@digit/lib-common';
import {
  backendPath,
  createHandler,
  err,
  ok,
  requireEnv,
} from '@digit/lib-backend';

export default createHandler({
  fetch: async ({ request, env }) => {
    const path = backendPath(request);

    if (request.method === 'GET' && path === '/external-status') {
      const apiBase = requireEnv({ env, key: 'API_BASE_URL' });
      const apiKey = requireEnv({ env, key: 'THIRD_PARTY_API_KEY' });
      const response = await fetch(`${apiBase.replace(/\/$/, '')}/status`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!response.ok) {
        return err({
          code: AppErrorCode.UPSTREAM_ERROR,
          message: `Upstream failed (HTTP ${response.status}).`,
          status: 502,
        });
      }
      return ok({ data: await response.json() });
    }

    return err({ code: AppErrorCode.NOT_FOUND, message: 'Not found.', status: 404 });
  },
});
```

D1 (when declared in the manifest) appears under the binding name you chose — also via
`requireEnv`:

```js
const db = requireEnv({ env, key: 'MY_APP_DB' });
await db.prepare('SELECT 1').first();
```

Never put secret values or raw upstream bodies into `error.message` / success `data`.

## Frontend pattern

Frontend reads env-backed data only through the backend proxy, via hooks:

```ts
import { AppErrorAlert, useBackendQuery } from '@digit/lib-frontend';

const { data, error, loading, refetch } = useBackendQuery<{ authenticated: boolean }>({
  path: '/external-status',
});
```

Do not hand-roll `/proxy/backend` fetches without `X-Digit-Proxy-Client` (the hooks set it).

## When you need a backend

| Situation | Backend required? |
| --- | --- |
| Pure UI | No |
| Digit GraphQL via `useDigitApiQuery` / `DigitProxyClient` | No |
| Read non-secret config from Digit app settings | Yes |
| Call third-party APIs with secrets | Yes |
| App-own persistence (D1) | Yes (`backend.d1`) |

## Setup for users

1. Create the app in Digit
2. Set env vars / secrets on the app in Digit
3. Publish a bundle whose manifest declares `backend.kind: "cloudflare-worker"`
4. Ship `backend/index.js` that reads those keys via `requireEnv` inside `createHandler`
