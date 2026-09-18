# `@digit/lib-frontend`

Sutton frontend kit for custom apps: MUI theme (`SuttonThemeProvider`), React data
hooks for the Sutton API and app backend, and error normalization/display.
Snapshot of Sutton web’s theme adapted for the public apps starter.

## Public API

Import from the package root only. Theme tokens, error parsers, and other modules
under `src/` are implementation details — use `SuttonThemeProvider`, the hooks, and
`AppErrorAlert`. `DigitThemeProvider`, `useDigitApiQuery` / `useDigitApiMutation`, and
the `DigitHost*` types remain supported aliases.

## Why a copy (not an import from digit-web)

`digit-web` is private; this starter is public. Tokens and helpers live here so
agents and customers can build Sutton-looking apps without access to the web
monorepo.

When web theme changes, update the files under `src/` (manual PR or sync script
from the private repo) — do not reintroduce imports from private packages.

## Theme usage

Every app template wraps its UI in `SuttonThemeProvider`:

```tsx
import { createRoot } from "react-dom/client";
import { SuttonThemeProvider } from "@digit/lib-frontend";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <SuttonThemeProvider>
    <App />
  </SuttonThemeProvider>,
);
```

The provider:

- Builds MUI `createTheme(themeOptions(darkMode))`
- Syncs light/dark from `window.SuttonHost` (falls back to `data-theme` / `prefers-color-scheme`)
- Applies Sutton-themed MUI `CssBaseline`

Harness types for `window.SuttonHost` (`SuttonHost`, `SuttonHostSettings`,
`SuttonHostDownloadOptions`, and `SuttonHostPrintOptions`) are exported from this package.
Importing `@digit/lib-frontend` also augments `Window` (`SuttonHost` aliases the host-injected
`DigitHost`). Prefer the data hooks over calling `window.SuttonProxyClient` yourself. Do not
add a local `digit.d.ts` for the harness.

Host-mediated printing takes a self-contained HTML snapshot:

```ts
const html = `
  <style>
    body { font: 14px system-ui; color: #111; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 6px; border-bottom: 1px solid #ddd; text-align: left; }
  </style>
  <main>
    <h1>Packing slip 1042</h1>
    <table><tr><th>Item</th><th>Qty</th></tr><tr><td>Widget</td><td>2</td></tr></table>
  </main>`;

window.SuttonHost?.print({ title: "Packing Slip 1042", html });
```

The print document runs no JavaScript. Inline CSS and convert images or canvases to
`data:image/...` before calling `print`; remote `http(s)` assets do not load (print CSP
is `img-src data:`). Keep the result under 10MB. Use `SuttonHost.download` for PDF bytes.

Use MUI components (`Button`, `TextField`, `Typography`, …). Prefer theme palette
tokens over hard-coded colors.

## Sutton API & backend hooks

Prefer the React hooks — they call the harness `SuttonProxyClient` / `DigitProxyClient` and normalize
platform / GraphQL / backend failures for `AppErrorAlert`:

```tsx
import {
  AppErrorAlert,
  useSuttonApiQuery,
  useSuttonApiMutation,
  useBackendQuery,
  useBackendMutation,
} from "@digit/lib-frontend";

// Sutton GraphQL API
const { data, error, loading, refetch } = useSuttonApiQuery({
  query: ITEMS_QUERY,
  variables: { connection: { first: 10 } },
});
const [createItem] = useSuttonApiMutation({ mutation: CREATE_ITEM });

// App Worker (/proxy/backend)
const notes = useBackendQuery<{ notes: Note[] }>({ path: "/notes" });
const [mutateNote, { error: saveError, loading: saving }] =
  useBackendMutation();
await mutateNote({ path: "/notes", method: "POST", body: { title: "Hi" } });
```

| Hook                                       | Hits                             |
| ------------------------------------------ | -------------------------------- |
| `useSuttonApiQuery` / `useSuttonApiMutation` | Sutton GraphQL via `/proxy/digit` |
| `useBackendQuery` / `useBackendMutation`   | App Worker via `/proxy/backend`  |

Error kinds:

| Kind          | Source                                                                |
| ------------- | --------------------------------------------------------------------- |
| `platform`    | digit-apps proxy/session (`{ error: { code, message, requestId? } }`) |
| `graphql`     | HTTP 200 + `errors[]` from Sutton GraphQL                              |
| `backend`     | App Worker result `{ ok: false, error: { code, message } }`           |
| `unavailable` | Missing `DigitProxyClient` (local Vite without harness)               |
| `unknown`     | Thrown / non-JSON / unexpected shapes                                 |

Platform codes stay distinct from app codes (`AppErrorCode` on `@digit/lib-common`).
Pair with `@digit/lib-backend` on the Worker so result shapes match.

`AppErrorAlert` maps known platform / backend codes to a title, safe message, optional
next-step guidance (e.g. `MISSING_CONFIG` → set env/secrets in Sutton), visible support
info for debugging, and Retry when the error looks transient. Prefer rendering
`AppErrorAlert` over branching on codes in app UI.

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

Styling is MUI + `SuttonThemeProvider` only — do not add parallel CSS variable themes.
The Sutton harness may inject Inter on the shell HTML.
