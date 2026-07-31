# Hello World

Minimal Digit app: React + MUI, themed with `@digit/app-theme`'s `DigitThemeProvider`.
Mounts to `#root`, no Digit API permissions, no backend.

## Develop

```bash
npm install
npm run dev
```

## Build for publish

```bash
npm run build
```

Produces `frontend/manifest.json` + `frontend/main.js` (CSS inlined). Zip the parent
folder so the archive contains `frontend/` at the root, then publish via the Digit MCP flow.
