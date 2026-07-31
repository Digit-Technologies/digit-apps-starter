# `@digit/app-backend`

Helpers for Digit app Cloudflare Workers (bundled into `backend/worker.js`).

Depends on [`@digit/app-shared`](../app-shared) for results, codes, and pure
validation — this package adds `Response` helpers and Worker utilities.

## Public API

Import from the package root only. Helpers take named arguments.

Wrap the Worker with `createHandler` so every response is structured JSON
(`{ ok: true, data }` / `{ ok: false, error }`), including unexpected throws.

```js
import { createHandler, requireEnv, ok, fail, AppErrorCode } from '@digit/app-backend';

export default createHandler({
  fetch: async ({ request, env }) => {
    const message = requireEnv({ env, key: 'WELCOME_MESSAGE' });
    return ok({ data: { message } });
  },
});
```

- **Expected domain failures** → `return fail({ code, message, status })`
- **Missing env / bindings** → `requireEnv` throws `HandlerError`; `createHandler` maps it to `fail`
- **Anything else thrown** → `SERVER_ERROR` (details are not leaked to the client)

## Result responses

```js
import { ok, fail, AppErrorCode } from '@digit/app-backend';

ok({ data: { notes: [] } }); // Response.json({ ok: true, data })
fail({ code: AppErrorCode.VALIDATION_ERROR, message: 'title is required.', status: 400 });
```

## Validation

```js
import { parseJsonObject, parseObject, requiredString, optionalString, fail, ok } from '@digit/app-backend';

const body = await parseJsonObject({ value: request.json() });
if (!body.ok) {
  return fail({ code: body.error.code, message: body.error.message, status: 400 });
}

const parsed = parseObject({
  value: body.value,
  fields: {
    title: (obj) => requiredString({ obj, key: 'title' }),
    body: (obj) => optionalString({ obj, key: 'body', default: '' }),
  },
});
if (!parsed.ok) {
  return fail({ code: parsed.error.code, message: parsed.error.message, status: 400 });
}
return ok({ data: { note: parsed.value } });
```

## Other helpers

- `requireEnv` / `optionalEnv` — env vars, secrets, and bindings (D1, …)

Use plain `fetch` for third-party HTTP. Map failures with `fail({ code: AppErrorCode.UPSTREAM_ERROR, … })`
and never put secret values or raw upstream bodies into `error.message` / `data`.

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
