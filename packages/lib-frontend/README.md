# `@digit/lib-frontend`

Digit frontend kit for custom apps: MUI theme (`DigitThemeProvider`), React data
hooks for the Digit API and app backend, and error normalization/display.
Snapshot of Digit web’s theme adapted for the public apps starter.

## Public API

Import from the package root only. Theme tokens, error parsers, and other modules
under `src/` are implementation details — use `DigitThemeProvider`, the hooks,
`AppErrorAlert`, `printLabel`, and `LabelPrintDialog`.

## Why a copy (not an import from digit-web)

`digit-web` is private; this starter is public. Tokens and helpers live here so
agents and customers can build Digit-looking apps without access to the web
monorepo.

When web theme changes, update the files under `src/` (manual PR or sync script
from the private repo) — do not reintroduce imports from private packages.

## Theme usage

Every app template wraps its UI in `DigitThemeProvider`:

```tsx
import { createRoot } from "react-dom/client";
import { DigitThemeProvider } from "@digit/lib-frontend";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <DigitThemeProvider>
    <App />
  </DigitThemeProvider>,
);
```

The provider:

- Builds MUI `createTheme(themeOptions(darkMode))`
- Syncs light/dark from `AppHost` (falls back to `data-theme` / `prefers-color-scheme`)
- Applies Digit `CssBaseline`

`AppHost` is the host page's API: `invoke`, `getSettings`, `onSettingsChange` and
`capabilities`. It works inside the Digit app harness and on a page Digit embeds directly,
such as a custom side-nav link, where it talks to Digit over the same messages. Its types
(`AppHostSettings`, `AppHostDownloadOptions`, `AppHostPrintOptions`) are exported too, and
importing the package augments `Window`. `window.DigitHost` and its `Digit*` types are
deprecated. Prefer the data hooks over calling `window.AppProxy` yourself. Do not add a local
`digit.d.ts` for the harness.

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

await AppHost.invoke("print", { title: "Packing Slip 1042", html });
```

The print document runs no JavaScript. Inline CSS and convert images or canvases to
`data:image/...` before calling `invoke("print", ...)`; remote `http(s)` assets do not load (print CSP
is `img-src data:`). Keep the result under 10MB. Use `invoke("download", ...)` for PDF bytes.

For inventory and item labels designed in Sutton, do not rebuild the layout in the app. Name the
label and the record by id. `LabelPrintDialog` asks the host to render with the same code native
label print uses, shows the HTML in a sandboxed iframe, and prints only after the user confirms:

```tsx
import { useState } from "react";
import Button from "@mui/material/Button";
import { LabelPrintDialog } from "@digit/lib-frontend";

function PrintInventoryLabel({ labelId, inventoryId }: { labelId: string; inventoryId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Print label</Button>
      <LabelPrintDialog
        open={open}
        onClose={() => setOpen(false)}
        labelId={labelId}
        entityType="inventory"
        entityId={inventoryId}
        copies={2}
      />
    </>
  );
}
```

`printLabel({ labelId, entityType, entityId, copies?, mode })` calls
`AppHost.invoke("printLabel", ...)`. `mode: "preview"` resolves
`{ html, title, widthIn, heightIn, copies, withheldPermissions }` and prints nothing — show it with
`LabelPreview`. Declare the full label permission set in `manifest.json` up front (`READ_CUSTOM_LABEL_CONFIGURATION`,
`READ_INVENTORY`, `READ_ITEM`, `READ_JOB`, `READ_ITEM_CUSTOMER`, `READ_PURCHASE_ORDER`,
`READ_COMPANY_DETAILS`, `READ_ITEM_VENDOR`): a label prints blanks for data the manifest doesn't
cover. `withheldPermissions` lists what was left off (for example `READ_JOB` for the MO number). `LabelPrintDialog` shows the list and disables Print until it is empty.
`mode: "print"` resolves `{ printed: true }` after the host opens the print dialog. Do not pass
`preview: boolean`, and do not treat any non-null result as printed. Calls are spaced to the host's
limit of one per second. It rejects on a host that doesn't offer it, for a label with no composer
`layoutJson`, when the label doesn't match the record type, and when the document is too large. The
host loads the records. Look up the label id via Digit MCP before shipping.

Use MUI components (`Button`, `TextField`, `Typography`, …). Prefer theme palette
tokens over hard-coded colors.

## Digit API & backend hooks

Prefer the React hooks — they call the harness `AppProxy` and normalize
platform / GraphQL / backend failures for `AppErrorAlert`:

```tsx
import {
  AppErrorAlert,
  useDigitApiQuery,
  useDigitApiMutation,
  useBackendQuery,
  useBackendMutation,
} from "@digit/lib-frontend";

// Digit GraphQL API
const { data, error, loading, refetch } = useDigitApiQuery({
  query: ITEMS_QUERY,
  variables: { connection: { first: 10 } },
});
const [createItem] = useDigitApiMutation({ mutation: CREATE_ITEM });

// App Worker (/proxy/backend)
const notes = useBackendQuery<{ notes: Note[] }>({ path: "/notes" });
const [mutateNote, { error: saveError, loading: saving }] =
  useBackendMutation();
await mutateNote({ path: "/notes", method: "POST", body: { title: "Hi" } });
```

| Hook                                       | Hits                             |
| ------------------------------------------ | -------------------------------- |
| `useDigitApiQuery` / `useDigitApiMutation` | Digit GraphQL via `/proxy/digit` |
| `useBackendQuery` / `useBackendMutation`   | App Worker via `/proxy/backend`  |

Error kinds:

| Kind          | Source                                                                |
| ------------- | --------------------------------------------------------------------- |
| `platform`    | digit-apps proxy/session (`{ error: { code, message, requestId? } }`) |
| `graphql`     | HTTP 200 + `errors[]` from Digit GraphQL                              |
| `backend`     | App Worker result `{ ok: false, error: { code, message } }`           |
| `unavailable` | Missing `AppProxy` (local Vite without harness)                       |
| `unknown`     | Thrown / non-JSON / unexpected shapes                                 |

Platform codes stay distinct from app codes (`AppErrorCode` on `@digit/lib-common`).
Pair with `@digit/lib-backend` on the Worker so result shapes match.

`AppErrorAlert` maps known platform / backend codes to a title, safe message, optional
next-step guidance (e.g. `MISSING_CONFIG` → set env/secrets in Digit), visible support
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

Styling is MUI + `DigitThemeProvider` only — do not add parallel CSS variable themes.
The Digit harness may inject Inter on the shell HTML.
