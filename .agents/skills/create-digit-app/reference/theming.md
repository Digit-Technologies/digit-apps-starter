# Theming

Digit apps should look like Digit. Use **one stack only**:

**React + MUI + `@heysutton/lib-frontend` (`DigitThemeProvider`)**

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
    "@heysutton/lib-frontend": "file:../../packages/lib-frontend",
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
[`@heysutton/lib-backend`](../../../../packages/lib-backend). Bundling is handled by
`@heysutton/lib-build` (`digit-app pack`) — see `examples/full-featured`.

## Provider

```tsx
import { DigitThemeProvider } from '@heysutton/lib-frontend';

createRoot(rootEl).render(
  <DigitThemeProvider>
    <App />
  </DigitThemeProvider>,
);
```

`DigitThemeProvider`:

1. Reads light/dark from `AppHost` (exported from `@heysutton/lib-frontend` with its
   `AppHostSettings` type; importing the package augments `Window`)
2. Falls back to `document.documentElement.dataset.theme`, then `prefers-color-scheme`
3. Calls `createTheme(themeOptions(darkMode))` and renders MUI `CssBaseline`

Do not add a local `digit.d.ts` for the harness globals. Prefer hooks over calling
`window.AppProxy` yourself.

## Host settings

```ts
import { AppHost } from '@heysutton/lib-frontend';

AppHost.getSettings(); // AppHostSettings | null
AppHost.onSettingsChange((settings) => { /* ... */ });
```

`DigitThemeProvider` bundles self-hosted Inter (`inter-ui`, same package as
digit-web). Do not add a Google Fonts or other CDN stylesheet. The harness sets
`data-theme` and `lang` on `<html>`. App look-and-feel comes from MUI +
`DigitThemeProvider`, not a parallel CSS design system.

## UI rules for agents

Prefer these `@heysutton/lib-frontend` components over the raw MUI equivalents:

| Instead of | Use |
| --- | --- |
| MUI `Dialog` | `Modal` |
| MUI `TextField` for a labeled form field | `InputTextField` |
| MUI `IconButton` as a hand-rolled icon control | `IconWrapper` around a Lucide icon, or `InvisibleButton` for a link-styled action |

`IconWrapper` sets Lucide's stroke to `1.25` (digit-web's stroke) unless the icon
already sets `strokeWidth`. `InputTextField` is a react-hook-form field: the app
must depend on `react-hook-form` and `@hookform/error-message`. Pass `removeBorder`
for digit-web's detail-inset layout (`getDetailInsetProps` /
`resolveDetailInsetMode`). Those rules are already in `DigitThemeProvider`.

```tsx
import { useForm } from 'react-hook-form';
import { IconWrapper, InputTextField, InvisibleButton, Modal } from '@heysutton/lib-frontend';
import { Pencil } from 'lucide-react';

const { control } = useForm({ defaultValues: { name: '' } });

<InvisibleButton onClick={() => setOpen(true)}>Edit name</InvisibleButton>
<Modal open={open} setOpen={setOpen} title="Name" mainCtaText="Save" mainCtaAction={submit}>
  <InputTextField control={control} name="name" label="Name" />
</Modal>
<IconWrapper size={16}><Pencil /></IconWrapper>
```

- Prefer other MUI components styled by the theme (`Button`, `Typography`,
  `Stack`, `Box`, `Table`, `Alert`, …)
- Prefer `theme.palette.*` / typography variants over hard-coded hex colors
- Do not restyle MUI from scratch, and do not invent a parallel CSS design system
- Do not reintroduce cream/teal “starter” palettes or IBM Plex / decorative
  gradients from older vanilla examples
- Do not invent a CSS custom-property theme — use MUI + `DigitThemeProvider`
- Stay inside the host iframe: no downloads, new tabs/popups, or
  `alert`/`confirm`/`prompt`. Use `Modal` for confirmations. MUI Drawer is fine. See
  [iframe-constraints.md](iframe-constraints.md).
- Do not assume the harness injects React, MUI, or fonts — only host APIs.
  Inter comes from `DigitThemeProvider`
