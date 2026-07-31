# `@digit/app-backend`

Helpers for Digit app Cloudflare Workers (bundled into `backend/worker.js`).

Depends on [`@digit/app-shared`](../app-shared) for results, codes, and pure
validation — this package adds `Response` helpers and Worker utilities.

## Errors without `instanceof Response`

Assert/require helpers **throw** `HttpError` instead of returning `T | Response`.
Catch once at the Worker entry:

```js
import { toErrorResponse, assertExists, requireEnv, ok } from '@digit/app-backend';

export default {
  async fetch(request, env) {
    try {
      const db = assertExists({ env, variant: 'database', key: 'MY_APP_DB' });
      const message = requireEnv(env, 'WELCOME_MESSAGE');
      return ok({ message });
    } catch (error) {
      return toErrorResponse(error);
    }
  },
};
```

Use `return fail(code, message, status)` for expected domain failures you handle inline
(e.g. not found). Use throws for missing config / bad input / upstream failures.

## Result responses

```js
import { ok, fail, AppErrorCode } from '@digit/app-backend';

ok({ notes: [] }); // Response.json({ ok: true, data })
fail(AppErrorCode.VALIDATION_ERROR, 'title is required.', 400); // { ok: false, error }
```

## Validation

```js
import { parseObject, requiredString, optionalString, readJsonObject, orFail, ok } from '@digit/app-backend';

const note = orFail(
  parseObject(await readJsonObject(request), {
    title: (obj) => requiredString(obj, 'title'),
    body: (obj) => optionalString(obj, 'body', { default: '' }),
  }),
);
return ok({ note });
```

## Other helpers

- `requireEnv` / `optionalEnv` — string env vars and secrets
- `assertExists({ env, variant, key })` — e.g. `variant: 'database'`
- `pathSegments` — strip `/proxy/backend` prefix
- `fetchJson` — upstream HTTP (throws `UPSTREAM_ERROR` on failure)

Never put secret values into `error.message` or `data`.

## Bundle with Vite

```json
"build:backend": "vite build --config vite.backend.config.ts && mkdir -p backend/migrations && cp worker/migrations/*.sql backend/migrations/"
```

See `examples/full-featured` for `vite.backend.config.ts`.

## Depend

```json
{
  "dependencies": {
    "@digit/app-backend": "file:../../packages/app-backend"
  }
}
```
