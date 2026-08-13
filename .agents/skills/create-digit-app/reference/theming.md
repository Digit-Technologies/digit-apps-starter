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
    "@emotion/styled": "^11.14.0",
    "@mui/material": "^7.3.9",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
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

1. Reads light/dark from `window.DigitHost` (types: `DigitHost` / `DigitHostSettings`
   exported from `@digit/lib-frontend`; importing the package augments `Window`)
2. Falls back to `document.documentElement.dataset.theme`, then `prefers-color-scheme`
3. Calls `createTheme(themeOptions(darkMode))` and renders MUI `CssBaseline`

Do not add a local `digit.d.ts` for `DigitHost`. Prefer hooks over calling
`window.DigitProxyClient` yourself.

## Host settings

```ts
import type { DigitHostSettings } from '@digit/lib-frontend';

window.DigitHost?.getSettings(); // DigitHostSettings | null
window.DigitHost?.onSettingsChange((settings) => { /* ... */ });
```

The harness also sets `data-theme` and `lang` on `<html>`, and may inject self-hosted
Inter before the bundle loads. App look-and-feel comes from MUI + `DigitThemeProvider`,
not a parallel CSS-variable theme.

## UI rules for agents

- Prefer MUI components styled by the theme (`Button`, `TextField`, `Typography`,
  `Stack`, `Box`, `Table`, `Alert`, …)
- Prefer `theme.palette.*` / typography variants over hard-coded hex colors
- Do not reintroduce cream/teal “starter” palettes or IBM Plex / decorative
  gradients from older vanilla examples
- Do not invent a CSS custom-property theme — use MUI + `DigitThemeProvider`
- Stay inside the host iframe: no downloads, new tabs/popups, or
  `alert`/`confirm`/`prompt`. MUI Dialog/Drawer are fine. See
  [iframe-constraints.md](iframe-constraints.md).
- Do not assume the harness injects React or MUI — only fonts and host APIs
