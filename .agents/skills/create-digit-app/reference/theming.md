# Theming

Digit apps should look like Digit. Use **one stack only**:

**React + MUI + `@heysutton/sdk-react` (`ThemeProvider`)**

Do not invent a parallel design system, skip the frontend package, or ship vanilla
HTML/CSS UI for new apps.

## Package

`@heysutton/sdk-react` ships the Sutton MUI theme (palette, typography, component
overrides) as `ThemeProvider`. Use it as-is. Don't copy its tokens into your app,
add Modal / field / icon wrapper libraries, or build a second design system on top.
Wrap the app in this `ThemeProvider`, not MUI's own `ThemeProvider` (it already wraps
MUI's). If a file needs MUI's too, import it under another name.

Depend on it from an app:

```json
{
  "dependencies": {
    "@heysutton/sdk-react": "file:../../packages/sdk-react",
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.1",
    "@mui/material": "^9.3.1",
    "react": "^19.2.8",
    "react-dom": "^19.2.8"
  }
}
```
Use `file:../packages/sdk-react` when the app sits at the repo root (not under
`examples/`).

For Worker helpers (`createHandler`, `backendPath`, `ok`/`err`, `requireEnv`), depend on
[`@heysutton/sdk-server`](../../../../packages/sdk-server). Bundling is handled by
`@heysutton/cli` (`sutton studio pack`) — see `examples/full-featured`.

## Provider

```tsx
import { ThemeProvider } from '@heysutton/sdk-react';

createRoot(rootEl).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
);
```

`ThemeProvider`:

1. Reads light/dark from `AppHost` (exported from `@heysutton/sdk-react` with its
   `AppHostSettings` type; importing the package augments `Window`)
2. Falls back to `document.documentElement.dataset.theme`, then `prefers-color-scheme`
3. Calls `createTheme(themeOptions(darkMode))` and renders MUI `CssBaseline`

Do not add a local `digit.d.ts` for the harness globals. Prefer hooks over calling
`window.AppProxy` yourself.

## Host settings

```ts
import { AppHost } from '@heysutton/sdk-react';

AppHost.getSettings(); // AppHostSettings | null
AppHost.onSettingsChange((settings) => { /* ... */ });
```

`ThemeProvider` bundles self-hosted Inter (`inter-ui`). Do not add a Google Fonts or other CDN stylesheet. The harness sets
`data-theme` and `lang` on `<html>`. App look-and-feel comes from MUI +
`ThemeProvider`, not a parallel CSS design system.

## UI rules for agents

- Prefer MUI components styled by the theme (`Button`, `TextField`, `Typography`,
  `Stack`, `Box`, `Table`, `Alert`, …)
- Prefer `theme.palette.*` / typography variants over hard-coded hex colors
- Do not restyle MUI from scratch, and do not invent a parallel CSS design system
- Do not reintroduce cream/teal “starter” palettes or IBM Plex / decorative
  gradients from older vanilla examples
- Do not invent a CSS custom-property theme — use MUI + `ThemeProvider`
- Stay inside the host iframe: no downloads, new tabs/popups, or
  `alert`/`confirm`/`prompt`. MUI Dialog/Drawer are fine. See
  [iframe-constraints.md](iframe-constraints.md).
- Do not assume the harness injects React, MUI, or fonts — only host APIs.
  Inter comes from `ThemeProvider`
