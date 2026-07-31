# Theming

Digit apps should look like Digit. Use **one stack only**:

**React + MUI + `@digit/app-theme` (`DigitThemeProvider`)**

Do not invent a parallel design system, skip the theme package, or ship vanilla
HTML/CSS UI for new apps.

## Package

[`packages/digit-theme`](../../../../packages/digit-theme) is a public snapshot of
Digit web’s MUI theme (palette, typography, component overrides). The private
`digit-web` repo is **not** a dependency — keep this package self-contained.

Depend on it from an app:

```json
{
  "dependencies": {
    "@digit/app-theme": "file:../../packages/digit-theme",
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.0",
    "@mui/material": "^7.3.9",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

Use `file:../packages/digit-theme` when the app sits at the repo root (not under
`examples/`).

Vite must set `resolve: { preserveSymlinks: true }` so peer deps resolve from the
app’s `node_modules` when the theme is linked via `file:`.

## Provider

```tsx
import { DigitThemeProvider } from '@digit/app-theme';

createRoot(rootEl).render(
  <DigitThemeProvider>
    <App />
  </DigitThemeProvider>,
);
```

`DigitThemeProvider`:

1. Reads light/dark from `window.DigitHost` (host pushes theme via postMessage)
2. Falls back to `document.documentElement.dataset.theme`, then `prefers-color-scheme`
3. Calls `createTheme(themeOptions(darkMode))` and renders MUI `CssBaseline`

## Host settings

```ts
window.DigitHost?.getSettings(); // { theme?: 'light'|'dark', language?: string } | null
window.DigitHost?.onSettingsChange((settings) => { /* ... */ });
```

The harness also sets `data-theme` and `lang` on `<html>`, and injects Digit CSS
tokens (`--digit-bg-default`, etc.) plus self-hosted Inter before the bundle loads.

## UI rules for agents

- Prefer MUI components styled by the theme (`Button`, `TextField`, `Typography`,
  `Stack`, `Box`, `Table`, `Alert`, …)
- Prefer `theme.palette.*` / typography variants over hard-coded hex colors
- Do not reintroduce cream/teal “starter” palettes or IBM Plex / decorative
  gradients from older vanilla examples
- Do not assume the harness injects React or MUI — only fonts, CSS vars, and host APIs
