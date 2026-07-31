# `@digit/app-shared`

Zero-dependency types and helpers shared by Digit app **frontend** and **backend**:

- App error codes (`VALIDATION_ERROR`, `MISSING_CONFIG`, …)
- JSON results `{ ok: true, data }` / `{ ok: false, error: { code, message } }`
- Pure validation (`asObject`, `requiredString`, `optionalString`, `parseObject`)

No React, no `Response` — those live in `@digit/app-frontend` / `@digit/app-backend`.

## Result

```ts
import { okResult, errResult, AppErrorCode } from '@digit/app-shared';

okResult({ notes: [] });
errResult(AppErrorCode.VALIDATION_ERROR, 'title is required.');
```

## Validation

Parsers return `{ ok: true, value }` or `{ ok: false, error: { code, message } }`:

```ts
import { parseObject, requiredString, optionalString } from '@digit/app-shared';

const parsed = parseObject(body, {
  title: (obj) => requiredString(obj, 'title'),
  body: (obj) => optionalString(obj, 'body', { default: '' }),
});

if (!parsed.ok) {
  // parsed.error.code / .message — map to fail() on the Worker or AppError in the UI
} else {
  // parsed.value.title, parsed.value.body
}
```

## Depend

```json
{
  "dependencies": {
    "@digit/app-shared": "file:../../packages/app-shared"
  }
}
```

`@digit/app-frontend` and `@digit/app-backend` already depend on this package.
