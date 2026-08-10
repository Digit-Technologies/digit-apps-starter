# Production Dashboard — source export

This is the app source for the "Production Dashboard" Digit app, exported from
`apps/production-dashboard` in a local clone of
[`digit-apps-starter`](https://github.com/Digit-Technologies/digit-apps-starter).

It's UI-only (no backend/Worker/D1) and depends on `@digit/lib-frontend` via a `file:`
link, so it can't be built standalone — it needs to live inside the starter monorepo.

## To use this again

1. Clone `digit-apps-starter` and run `npm install` once from the repo root.
2. Copy this folder to `apps/production-dashboard` in that clone.
3. From the repo root: `npm install` again (links the app into the workspace), then
   `npm run pack -w apps/production-dashboard` to produce `app.zip`.
4. Publish via Digit MCP: `generateAppUploadLink` → POST the zip to `uploadUrl` →
   `publishApp` → poll `appPublish`.

See `SPEC.md` for what the app does, why each manifest permission exists, gotchas found
while building it (notably how `inventoryQuantityProduced` is returned), and the
starter prompt.

## Contents

- `manifest.json` — declares `READ_ORGANIZATION_DETAIL_AND_METRICS` (required by
  `dailyMetrics`); no `backend` block.
- `src/frontend/` — React + MUI + `@digit/lib-frontend` UI:
  - `main.tsx` — mounts `<App />` inside `DigitThemeProvider`.
  - `App.tsx` — page layout (KPI row + charts row) and the "Preview data" toggle.
  - `useDailyMetrics.ts` — fetches `dailyMetrics`, normalizes the response (including the
    unit-aware handling for `inventoryQuantityProduced`) into per-day series. Accepts a
    `previewMode` flag; when on, skips the real query and returns stub data instead.
  - `previewStubData.ts` — realistic-but-fake 8-day numbers for demoing/screenshotting the
    layout, toggled at runtime (default off) rather than a code-level flag.
  - `dateWindow.ts` — local-timezone day-boundary + timezone-abbreviation helpers.
  - `components/` — the four KPI tiles and two charts.
- `SPEC.md` — purpose, permissions rationale, gotchas, and starter prompt.
