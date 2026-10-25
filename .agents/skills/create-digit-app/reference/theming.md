# Theming

Digit apps should look like Digit. Use **one stack only**:

**React + MUI + `@digit/lib-frontend` (`DigitThemeProvider`)**

Do not invent a parallel design system, skip the frontend package, or ship vanilla
HTML/CSS UI for new apps.

## Package

[`packages/lib-frontend`](../../../../packages/lib-frontend) implements the Sutton Figma design
system as an MUI theme (palette, typography, component overrides) plus the components that group
themed parts. It is self-contained: the private `digit-web` repo is **not** a dependency.

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

## Building UI

This file covers wiring the theme up. For how screens should look, follow
[design-system.md](design-system.md) (rules, component picker, tokens),
[components.md](components.md) (props per component) and
[design-patterns.md](design-patterns.md) (screen recipes).

Do not assume the harness injects React, MUI or fonts; it injects only host APIs.
