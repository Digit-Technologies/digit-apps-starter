# `@digit/lib-frontend`

Digit frontend kit for custom apps: MUI theme (`DigitThemeProvider`), React data
hooks for the Digit API and app backend, and error normalization/display.
Snapshot of Digit web’s theme adapted for the public apps starter.

## Public API

Import from the package root only. Theme tokens, error parsers, and other modules
under `src/` are implementation details — use `DigitThemeProvider`, the hooks,
`AppErrorAlert`, the design-system components, the Lucide icons, `printLabel`,
`LabelPrintPanel`, `LabelPrintDialog`, `LabelPreview`, and `useLabelPrint`.

## Design system

The theme implements the Figma design system (file `C3TddYPmYbAEpsPMRPoKpw`: the Styles, Atoms
and Molecules pages), in light and dark. Every MUI component an app uses is restyled to the
Figma values, so apps compose components and never style them. The components below are the
composite pieces from the Figma molecules and the product mockups:

| Area | Components |
| --- | --- |
| Page structure | `PageHeader`, `Section`, `RecordCard`, `RecordCardSection`, `PropertyGrid` |
| Lists | `Table`, `RecordName`, `Pill` |
| Panels and dialogs | `SidePanel`, `Modal`, `ModalHeader`, `ModalSection`, `ModalFooter`, `ConfirmDialog` |
| Settings and forms | `SettingsSection`, `SettingsRow`, `FormField`, `Switch`, `RadioCard`, `FileDropZone`, `FileUploadRow` |
| Feedback | `EmptyState`, `ProgressBar`, `AppErrorAlert` |

The agent-facing usage guide is
[`.agents/skills/create-digit-app/reference/design-system.md`](../../.agents/skills/create-digit-app/reference/design-system.md),
with screen recipes in `design-patterns.md` next to it.

Theme notes worth knowing:

- `theme.spacing(n)` returns `calc(var(--digit-spacing-base, 8px) * n)`, a string. CssBaseline
  sets the base to 8px, and 10px below 600px, so spacing scales on mobile as in Figma. Do not
  do arithmetic on spacing values.
- Every text style scales ×1.25 below 600px. Transitions are 20ms ease-in.
- Field sizes: `xs` 20px, `small`/`medium` 28px, `large` 36px. `variant="standard"` is the Figma
  invisible field; `outlined` renders the filled field, since Figma has no stroked field.
- `Typography color="text.secondary"` (any palette path) works; MUI 9 alone ignores it.
- Palette additions: `text.tertiary`, `background.secondary`/`surface`, `border.default`/
  `strong`/`extrastrong`/`solidStrong`/`solidDefault`, `table.hover`/`selected`, `opacity`.
- `focusRing(theme)` and `focusColor(theme)` in `theme/focus.ts` are the Figma focus treatment.

## Why a copy (not an import from digit-web)

`digit-web` is private; this starter is public. Tokens and helpers live here so
agents and customers can build Digit-looking apps without access to the web
monorepo.

When web theme changes, update the files under `src/theme` from that branch —
do not reintroduce imports from private packages, and do not edit the shared
tokens here without recording the reason below.

### Intentional diffs from digit-web

Colour scales, shadows and transitions come from `digit-web` `staging`
(`src/providers/AppThemeProvider` plus `src/constants/colors.ts`, `shadows.ts`,
`transitions.ts`, and `theme-extensions.ts`). Component looks follow the Figma design system;
where `digit-web` and Figma differ, Figma wins.

- `DigitThemeProvider` replaces `AppThemeProvider`. It follows `AppHost` theme
  settings. It does not use web’s view-mode storage, Lucide provider, or Clerk.
  It does restore the autofill `@keyframes` web puts on the provider, because
  `MuiInputBase` sets `disableInjectingGlobalStyles`.
- `cssVariables.ts` is starter-only (`data-theme` on `<html>`).
- `mobileScaleFactor` is its own module. The value matches web (`1.25`).
- Typography variant augmentations live in `types.ts`. Web declares
  `TypographyPropsVariantOverrides` on the provider module.
- `MuiMenu` uses MUI 9 `slotProps.backdrop`. Web’s `BackdropProps` prop is not
  on MUI 9. Both hide the menu backdrop.
- Left on web (private or host-only): Clerk rules in `MuiCssBaseline`,
  detail-inset form styles, `MuiPickers*`, and the `MuiAlert` warning icon that
  renders `IconWrapper`.
- Inter loads from `inter-ui/inter-variable.css` (`inter-ui@4.1.1`, same
  package as digit-web). Pack rewrites the font files to `/app/assets/…`.

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
label and the record by id. `LabelPrintPanel` asks the host to render with the same code native
label print uses, shows the HTML inline in a sandboxed iframe, and prints only after the user clicks
Print. Place it anywhere on the page:

```tsx
import { LabelPrintPanel } from "@digit/lib-frontend";

<LabelPrintPanel labelId={labelId} entityType="inventory" entityId={inventory.id} copies={2} />
```

Use `LabelPrintDialog` (same props plus `open` and `onClose`) when a modal is what the design needs,
and `useLabelPrint({ labelId, entityType, entityId, copies?, enabled?, onPrinted? })` for your own
layout. The hook returns `{ preview, loading, printing, error, canPrint, print, reload }`; render `preview` with `LabelPreview` and call `print` only while `canPrint` is true.

`printLabel({ labelId, entityType, entityId, copies?, mode })` calls
`AppHost.invoke("printLabel", ...)`. `mode: "preview"` resolves
`{ html, title, widthIn, heightIn, copies }` and prints nothing — show it with `LabelPreview`.
Declare `READ_CUSTOM_LABEL_CONFIGURATION`, `READ_INVENTORY` and `READ_ITEM` in `manifest.json` for
inventory labels (`READ_CUSTOM_LABEL_CONFIGURATION` and `READ_ITEM` for item labels); the call
rejects naming whichever is missing. Whatever else the label shows comes from the record, for what
the signed-in user can read.
`mode: "print"` resolves `{ printed: true }` after the host opens the print dialog. Do not pass
`preview: boolean`, and do not treat any non-null result as printed. Calls are spaced to the host's
limit of one per second. It rejects on a host that doesn't offer it, for a label with no composer
`layoutJson`, when the label doesn't match the record type, when the label size is outside 0.5 to
20 inches, when the document is too large, and with "A label is already being rendered" while
another label renders. The host loads the records. Look up the label id through the Sutton API
before shipping.

Use the design-system components and themed MUI components (`Button`, `TextField`,
`Typography`, …). Use palette tokens, never hard-coded colors.

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

Styling is MUI + `DigitThemeProvider` only — do not add a parallel CSS design
system or restyle MUI from scratch. `DigitThemeProvider` bundles self-hosted
Inter (`inter-ui`). Do not add a font CDN `<link>`.
