# `@heysutton/sdk`

Zero-dependency types and helpers shared by Sutton custom app **frontend** and **backend** code:

- App error codes (`VALIDATION_ERROR`, `MISSING_CONFIG`, …)
- JSON result **types** `{ ok: true, data }` / `{ ok: false, error: { code, message } }`
- Pure validation (`requiredString`, `optionalString`, `parseObject`, `parseJsonResponse`)

No React, no `Response` — those live in `@heysutton/sdk-react` / `@heysutton/sdk-server`.

## Public API

Import from the package root only (`AppErrorCode`, result types, validation helpers).
Other files under `src/` are implementation details.

Apps that use a Worker (or that branch on app error codes in the UI) should depend on this
package **directly**. `@heysutton/sdk-react` and `@heysutton/sdk-server` do **not** re-export
these helpers.

## Result wire shape

Worker responses use this JSON shape (built with `ok` / `err` from `@heysutton/sdk-server`):

```ts
import type { SuccessResult, ErrorResult, Result } from '@heysutton/sdk';

// SuccessResult: { ok: true, data: T }
// ErrorResult:   { ok: false, error: { code, message } }
```

App Workers should return `ok({ data })` / `err({ code, message })` from
`@heysutton/sdk-server` — do not hand-build these objects.

## Validation

Parsers return `{ ok: true, value }` or `{ ok: false, error: { code, message } }`
(note: `value`, not `data`):

```ts
import { parseObject, requiredString, optionalString } from '@heysutton/sdk';

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
    "@heysutton/sdk": "file:../../packages/sdk"
  }
}
```

With a Worker, depend on `@heysutton/sdk` alongside `@heysutton/sdk-server`.
Frontend-only apps can skip it unless they import codes/types in UI code.
