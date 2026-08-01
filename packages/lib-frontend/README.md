# `@digit/lib-frontend`

Digit frontend kit for custom apps: MUI theme (`DigitThemeProvider`), React data
hooks for the Digit API and app backend, and error normalization/display.
Snapshot of Digit web’s theme adapted for the public apps starter.

## Public API

Import from the package root only. Theme tokens, error parsers, and other modules
under `src/` are implementation details — use `DigitThemeProvider`, the hooks, and
`AppErrorAlert`.

## Why a copy (not an import from digit-web)

`digit-web` is private; this starter is public. Tokens and helpers live here so
agents and customers can build Digit-looking apps without access to the web
monorepo.

When web theme changes, update the files under `src/` (manual PR or sync script
from the private repo) — do not reintroduce imports from private packages.

## Theme usage

Every app template wraps its UI in `DigitThemeProvider`:

```tsx
import { createRoot } from 'react-dom/client';
import { DigitThemeProvider } from '@digit/lib-frontend';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <DigitThemeProvider>
    <App />
  </DigitThemeProvider>,
);
```

The provider:

- Builds MUI `createTheme(themeOptions(darkMode))`
- Syncs light/dark from `window.DigitHost` (falls back to `data-theme` / `prefers-color-scheme`)
- Applies Digit `CssBaseline`

Harness types for `window.DigitHost` (`DigitHost`, `DigitHostSettings`) are exported
from this package — importing `@digit/lib-frontend` also augments `Window`. Prefer the
data hooks over calling `window.DigitProxyClient` yourself. Do not add a local
`digit.d.ts` for the harness.

Use MUI components (`Button`, `TextField`, `Typography`, …). Prefer theme palette
tokens over hard-coded colors.

## Digit API & backend hooks

Prefer the React hooks — they call the harness `DigitProxyClient` and normalize
platform / GraphQL / backend failures for `AppErrorAlert`:

```tsx
import {
  AppErrorAlert,
  useDigitApiQuery,
  useDigitApiMutation,
  useBackendQuery,
  useBackendMutation,
} from '@digit/lib-frontend';

// Digit GraphQL API
const { data, error, loading, refetch } = useDigitApiQuery({
  query: ITEMS_QUERY,
  variables: { connection: { first: 10 } },
});
const [createItem] = useDigitApiMutation({ mutation: CREATE_ITEM });

// App Worker (/proxy/backend)
const notes = useBackendQuery<{ notes: Note[] }>({ path: '/notes' });
const [mutateNote, { error: saveError, loading: saving }] = useBackendMutation();
await mutateNote({ path: '/notes', method: 'POST', body: { title: 'Hi' } });
```

| Hook | Hits |
| --- | --- |
| `useDigitApiQuery` / `useDigitApiMutation` | Digit GraphQL via `/proxy/digit` |
| `useBackendQuery` / `useBackendMutation` | App Worker via `/proxy/backend` |

Error kinds:

| Kind | Source |
| --- | --- |
| `platform` | digit-apps proxy/session (`{ error: { code, message, requestId? } }`) |
| `graphql` | HTTP 200 + `errors[]` from Digit GraphQL |
| `backend` | App Worker result `{ ok: false, error: { code, message } }` |
| `unavailable` | Missing `DigitProxyClient` (local Vite without harness) |
| `unknown` | Thrown / non-JSON / unexpected shapes |

Platform codes stay distinct from app codes (`AppErrorCode` on `@digit/lib-common`).
Pair with `@digit/lib-backend` on the Worker so result shapes match.

`AppErrorAlert` maps known platform / backend codes to a title, safe message, optional
next-step guidance (e.g. `MISSING_CONFIG` → set env/secrets in Digit), Copy support
info, and Retry when the error looks transient. Prefer rendering `AppErrorAlert` over
branching on codes in app UI.

## Depend from an app

```json
{
  "dependencies": {
    "@digit/lib-frontend": "file:../../packages/lib-frontend"
  }
}
```

Apps must also depend on the peer packages (`react`, `react-dom`, `@mui/material`,
`@emotion/react`, `@emotion/styled`). Vite configs need `resolve.preserveSymlinks: true`
so peers resolve from the app’s `node_modules` when the package is linked via `file:`.

See also [`@digit/lib-backend`](../lib-backend) for Worker helpers.

## CSS tokens

`tokens.css` exposes `--digit-*` variables for non-MUI surfaces. The Digit app
harness also injects the same tokens + self-hosted Inter on the shell HTML.
