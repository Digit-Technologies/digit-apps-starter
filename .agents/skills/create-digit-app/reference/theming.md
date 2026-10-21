# Theming

Digit apps should look like Digit. Use **one stack only**:

**React + MUI + `@digit/lib-frontend` (`DigitThemeProvider`)**

Do not invent a parallel design system, skip the frontend package, or ship vanilla
HTML/CSS UI for new apps.

## Package

[`packages/lib-frontend`](../../../../packages/lib-frontend) is a public snapshot of
Digit web’s MUI theme (palette, typography, component overrides). The private
`digit-web` repo is **not** a dependency — keep this package self-contained.

Depend on it from an app:

```json
{
  "dependencies": {
    "@digit/lib-frontend": "file:../../packages/lib-frontend",
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.1",
    "@mui/material": "^9.3.1",
    "react": "^19.2.8",
    "react-dom": "^19.2.8"
  }
}
```
Use `file:../packages/lib-frontend` when the app sits at the repo root (not under
`examples/`).

For Worker helpers (`createHandler`, `backendPath`, `ok`/`err`, `requireEnv`), depend on
[`@digit/lib-backend`](../../../../packages/lib-backend). Bundling is handled by
`@digit/lib-build` (`digit-app pack`) — see `examples/full-featured`.

## Provider

```tsx
import { DigitThemeProvider } from '@digit/lib-frontend';

createRoot(rootEl).render(
  <DigitThemeProvider>
    <App />
  </DigitThemeProvider>,
);
```

`DigitThemeProvider`:

1. Reads light/dark from `AppHost` (exported from `@digit/lib-frontend` with its
   `AppHostSettings` type; importing the package augments `Window`)
2. Falls back to `document.documentElement.dataset.theme`, then `prefers-color-scheme`
3. Calls `createTheme(themeOptions(darkMode))` and renders MUI `CssBaseline`

Do not add a local `digit.d.ts` for the harness globals. Prefer hooks over calling
`window.AppProxy` yourself.

## Host settings

```ts
import { AppHost } from '@digit/lib-frontend';

AppHost.getSettings(); // AppHostSettings | null
AppHost.onSettingsChange((settings) => { /* ... */ });
```

`DigitThemeProvider` bundles self-hosted Inter (`inter-ui`, same package as
digit-web). Do not add a Google Fonts or other CDN stylesheet. The harness sets
`data-theme` and `lang` on `<html>`. App look-and-feel comes from MUI +
`DigitThemeProvider`, not a parallel CSS design system.

## UI rules for agents

The theme implements the Figma design system; [design-system.md](design-system.md) is the
component and token reference, and [design-patterns.md](design-patterns.md) has the screen
recipes. In short:

- Compose library components and theme-styled MUI components. Never restyle them: no `sx`,
  `style` or `styled()` that sets colour, border, radius, shadow, font or height on a themed
  component.
- Colours come from palette tokens (`text.secondary`, `background.secondary`,
  `border.solidDefault`, …), text styles from `Typography` variants. No hex values, no px font
  sizes, no `fontWeight`.
- Lists of records use `Table`; statuses and categories use `Pill`; icons are the Lucide set
  re-exported by `@digit/lib-frontend` (do not import `lucide-react` or another icon set).
- Do not invent a parallel CSS design system or a CSS custom-property theme, and do not add
  Google Fonts or other CDN stylesheets. Inter comes from `DigitThemeProvider`.
- Do not branch on `theme.palette.mode` in app code; every themed component already has its
  dark-mode values.
- Stay inside the host iframe: no downloads, new tabs/popups, or `alert`/`confirm`/`prompt`.
  MUI Dialog/Drawer are fine (prefer `Modal`, `SidePanel` and `ConfirmDialog`). See
  [iframe-constraints.md](iframe-constraints.md).
- Do not assume the harness injects React, MUI, or fonts — only host APIs.
