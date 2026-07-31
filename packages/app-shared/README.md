# `@digit/app-shared`

Zero-dependency types and helpers shared by Digit app **frontend** and **backend**:

- App error codes (`VALIDATION_ERROR`, `MISSING_CONFIG`, …)
- JSON results `{ ok: true, data }` / `{ ok: false, error: { code, message } }`
- Pure validation (`requiredString`, `optionalString`, `parseObject`)

No React, no `Response` — those live in `@digit/app-frontend` / `@digit/app-backend`.

## Public API

Import from the package root only (`AppErrorCode`, `okResult` / `errResult`,
`parseJsonResponse`, `parseObject` + string field helpers). Other files under `src/` are
implementation details.

`@digit/app-frontend` and `@digit/app-backend` already re-export the common pieces;
most apps never depend on this package directly.

## Result

```ts
import { okResult, errResult, AppErrorCode } from '@digit/app-shared';

okResult({ data: { notes: [] } });
errResult({ code: AppErrorCode.VALIDATION_ERROR, message: 'title is required.' });
```

## Validation

Parsers return `{ ok: true, value }` or `{ ok: false, error: { code, message } }`:

```ts
import { parseObject, requiredString, optionalString } from '@digit/app-shared';

const parsed = parseObject({
  value: body,
  fields: {
    title: (obj) => requiredString({ obj, key: 'title' }),
    body: (obj) => optionalString({ obj, key: 'body', default: '' }),
  },
});

if (!parsed.ok) {
  // parsed.error.code / .message — map to err() on the Worker or AppError in the UI
} else {
  // parsed.value.title, parsed.value.body
}
```

Require a JSON object (and optionally typed fields) with
`parseJsonResponse({ value: request.json(), fields? })`. For already-parsed values,
use `parseObject({ value, fields })`.

## Depend

```json
{
  "dependencies": {
    "@digit/app-shared": "file:../../packages/app-shared"
  }
}
```

`@digit/app-frontend` and `@digit/app-backend` already depend on this package.
