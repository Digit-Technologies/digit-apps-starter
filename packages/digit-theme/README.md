# `@digit/app-theme`

Digit MUI theme for custom apps. Snapshot of Digit web’s `AppThemeProvider`
(palette, typography, component overrides) adapted for the public apps starter.

## Why a copy (not an import from digit-web)

`digit-web` is private; this starter is public. Theme tokens live here so agents
and customers can build Digit-looking apps without access to the web monorepo.

When web theme changes, update the files under `src/` (manual PR or sync script
from the private repo) — do not reintroduce imports from private packages.

## Usage

Every app template wraps its UI in `DigitThemeProvider`:

```tsx
import { createRoot } from 'react-dom/client';
import { DigitThemeProvider } from '@digit/app-theme';
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

Use MUI components (`Button`, `TextField`, `Typography`, …). Prefer theme palette
tokens over hard-coded colors.

## Depend from an app

```json
{
  "dependencies": {
    "@digit/app-theme": "file:../../packages/digit-theme"
  }
}
```

Apps must also depend on the peer packages (`react`, `react-dom`, `@mui/material`,
`@emotion/react`, `@emotion/styled`). Vite configs need `resolve.preserveSymlinks: true`
so peers resolve from the app’s `node_modules` when the package is linked via `file:`.

## CSS tokens

`tokens.css` exposes `--digit-*` variables for non-MUI surfaces. The Digit app
harness also injects the same tokens + self-hosted Inter on the shell HTML.
