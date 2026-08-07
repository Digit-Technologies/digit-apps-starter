# `@digit/lib-backend`

Helpers for Digit app Cloudflare Workers (bundled into `backend/index.js`).

Depends on [`@digit/lib-common`](../lib-common) internally. Apps should also depend on
`@digit/lib-common` and import codes / validation from there — this package does **not**
re-export them.

## Public API

Import from the package root only. Helpers take named arguments.

| Export | Role |
| --- | --- |
| `createHandler` | Wrap `fetch` so every response is structured JSON |
| `backendPath` | Strip `/proxy/backend` from the request path |
| `ok` / `err` | Success / error `Response` helpers |
| `requireEnv` / `optionalEnv` | Read env vars, secrets, and bindings |
| `digitJobs` | The platform `DIGIT_JOBS` binding, typed — submit/inspect background jobs |
| `HandlerError` | Thrown by `requireEnv`; mapped by `createHandler` (apps rarely throw it) |

Wrap the Worker with `createHandler`. Use `backendPath(request)`, then match with normal
`method` + `path` checks:

```js
import { AppErrorCode } from '@digit/lib-common';
import { backendPath, createHandler, requireEnv, ok, err } from '@digit/lib-backend';

export default createHandler({
  fetch: async ({ request, env }) => {
    const path = backendPath(request);
    const { method } = request;

    if (method === 'GET' && path === '/greeting') {
      return ok({ data: { message: requireEnv({ env, key: 'WELCOME_MESSAGE' }) } });
    }

    if (method === 'PUT' && path.startsWith('/notes/')) {
      const id = path.slice('/notes/'.length);
      return ok({ data: { id } });
    }

    return err({ code: AppErrorCode.NOT_FOUND, message: 'Not found.', status: 404 });
  },
});
```

- **Expected domain failures** → `return err({ code, message, status })`
- **Missing env / bindings** → `requireEnv` throws `HandlerError`; `createHandler` maps it to `err`
- **Anything else thrown** → `SERVER_ERROR` (details are not leaked to the client)

## Result responses

```js
import { AppErrorCode } from '@digit/lib-common';
import { ok, err } from '@digit/lib-backend';

ok({ data: { notes: [] } }); // Response.json({ ok: true, data })
err({ code: AppErrorCode.VALIDATION_ERROR, message: 'title is required.', status: 400 });
```

## Validation

Import parsers from `@digit/lib-common`, then map failures with `err` from this package:

```js
import { parseJsonResponse, requiredString, optionalString } from '@digit/lib-common';
import { err, ok } from '@digit/lib-backend';

const parsed = await parseJsonResponse({
  value: request.json(),
  fields: {
    title: (obj) => requiredString({ obj, key: 'title' }),
    body: (obj) => optionalString({ obj, key: 'body', default: '' }),
  },
});
if (!parsed.ok) {
  return err({ code: parsed.error.code, message: parsed.error.message, status: 400 });
}
return ok({ data: { note: parsed.value } });
```

## Other helpers

- `backendPath` — pathname with `/proxy/backend` stripped
- `requireEnv` — required env vars, secrets, and bindings (D1, …); missing → `HandlerError`
- `optionalEnv` — optional value (`T | null`); use when absence is a valid branch

Use plain `fetch` for third-party HTTP. Map failures with `err({ code: AppErrorCode.UPSTREAM_ERROR, … })`
and never put secret values or raw upstream bodies into `error.message` / `data`.

## Jobs & schedules

Pass `jobs` to `createHandler` to handle background runs (manifest `backend.schedules`
ticks and jobs submitted via `digitJobs({ env }).submit(...)`); the platform invokes them
over RPC via the `triggerJob` method on the WorkerEntrypoint class `createHandler` returns:

```js
import { createHandler, digitJobs, ok } from '@digit/lib-backend';

export default createHandler({
  jobs: {
    'note-stats': async ({ payload, env }) => ({ count: await countNotes(env) }),
  },
  fetch: async ({ request, env }) => {
    const { runId } = await digitJobs({ env }).submit({ name: 'note-stats' });
    return ok({ data: { runId }, status: 202 });
  },
});
```

Return value → the run's `result`; a throw fails the attempt (retried). Full contract
(schedule rules, limits, run lifecycle): the skill's `reference/jobs-and-schedules.md`.

## Bundle

Use `@digit/lib-build` (`digit-app pack`) — do not add a per-app Vite backend config.
See `examples/full-featured`.

## Depend

```json
{
  "dependencies": {
    "@digit/lib-backend": "file:../../packages/lib-backend",
    "@digit/lib-common": "file:../../packages/lib-common"
  }
}
```
