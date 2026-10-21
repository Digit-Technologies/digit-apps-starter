# SPEC: Production Dashboard

## What it does

Single-page production dashboard for a manufacturing team to check at a glance. Fetches
`dailyMetrics` for today plus the prior 7 days (8 calendar days total, in the viewer's
local timezone) and renders four KPI tiles (units produced today w/ delta vs trailing
7-day average, MOs completed today, percent MOs completed on time with a gauge and a status
`Pill`, MOs open & late with a "Needs attention" / "On track" `Pill`) plus two 8-day charts
(line/area of units produced; grouped bar of MOs completed vs. MOs open late). UI-only — no
backend/Worker/D1.

"Today" and day boundaries are computed in the viewer's browser/device local timezone
(Digit apps have no org timezone field to read), and the resolved timezone abbreviation is
shown beside the "Today" section heading so the basis is obvious. Missing days or null
values are rendered as an explicit no-data state ("None" in a tile, an `EmptyState` in a
chart), never faked as zero.

## Data & permissions

- `READ_ORGANIZATION_DETAIL_AND_METRICS` — required by `Query.dailyMetrics` (confirmed via
  the `graphql-schema://type/Query` docstring: "Permissions: requires
  `READ_ORGANIZATION_DETAIL_AND_METRICS`"). Note: this key did **not** appear in the MCP
  `apiPermissions` list (which seems scoped to API-token-grantable permissions) — it was
  taken directly from the field's schema documentation instead, per the user's explicit
  instruction, since that is the authoritative source for what the resolver enforces.
- `dailyMetrics(startDate: DateTimeISO!, endDate: DateTimeISO!): [DailyMetric!]!` has no
  metric-type filter — it always returns every `MetricType`; the app filters client-side to
  the four it cares about (`inventoryQuantityProduced`, `numMOsCompleted`,
  `percentMOsCompletedOnTime`, `numMOsOpenLate`).
- `DailyMetric.valuesByDate[].value` is a `MetricValue` union (`MetricNumber { quantity }` /
  `MetricPercentage { percent }` used here); the query selects both via inline fragments
  plus `__typename`.
- Gotcha: a day with no data simply has no entry in `valuesByDate` for that date — it is
  not returned as an explicit null. The frontend pre-seeds all 8 expected day buckets as
  `null` and only fills in a bucket when a matching `date` (converted to a local calendar
  day) is found in the response.
- Gotcha (found after first publish): `inventoryQuantityProduced` resolves to
  `MetricMeasurements`, not `MetricNumber` — the initial query only selected fields on
  `MetricNumber`/`MetricPercentage`, so this metric silently came back empty
  (`{ __typename: "MetricMeasurements" }` with nothing else) even though the other three
  metrics worked fine. `MetricMeasurements.measurements` is `[{ value, uom { symbol } }]`
  because quantity-produced can span multiple units of measure. Fix: query
  `... on MetricMeasurements { measurements { value uom { symbol } } }`, then in
  `buildMeasurementSeries` (`useDailyMetrics.ts`) pick the UoM with the largest total
  across the window as "primary" and sum only that UoM per day — a day present in the
  response with no measurement in that UoM is a real `0`, not faked; a day absent from the
  response entirely stays `null`. The resolved UoM symbol is surfaced as
  `inventoryQuantityProducedUnit` and shown next to the number in both the tile and the
  chart heading.
- **Preview stub data (`previewStubData.ts`):** supplies realistic-but-fake 8-day numbers
  so the dashboard can be demoed/screenshotted without needing real manufacturing activity
  first. It's toggled at runtime via a "Preview data" switch in the header (state lives in
  `App.tsx`, passed into `useDailyMetrics(previewMode)`), defaulting to **off** — real
  `dailyMetrics` data is the default experience. When on, the real query is skipped
  entirely (`useDigitApiQuery({ ..., skip: previewMode })`) and a "Preview data" `Pill`
  renders as the `PageHeader` title adornment so the fake numbers are never mistaken for
  live output.
- **Layout (design-patterns.md › Dashboard):** `PageHeader` (title, the library `Switch`
  for preview data in `actions`), then `PageBody` on `background.secondary` with two
  `Section`s, "Today" and "Last 8 days". Tiles are themed `Card`s (`p: 2`, nothing else on
  the Card) in a CSS grid with an 8px column gap and a 16px row gap: 4 / 2 / 1 columns for
  the KPI row, 2 / 1 for the charts. Each tile's heading is a `Section` (rendered as `h4`
  under the page `Section`'s `h3`); the KPI number is `Typography variant="h2"`. Loading is
  `Skeleton` blocks in each tile, errors are `AppErrorAlert` with retry. No hex colours, no
  `fontSize`/`fontWeight`, no tinted or restyled cards: states that the first version showed
  with a red tile or coloured text are `Pill`s (`green` / `yellow` / `red`).
- **Chart styling:** series colours come only from palette accents —
  `theme.palette.blue.main` for units produced, `emerald.main` / `red.main` for MOs completed
  vs. open & late, and `emerald` / `amber` / `red` for the gauge arc by band (≥ 90%, ≥ 70%,
  below). Never `primary.main`: in this theme it is the near-black action colour, which once
  rendered the area chart as a solid black wedge. The area under the line is toned down with
  `fillOpacity` via `` `.${lineClasses.area}` ``; the line stays opaque. The gauge draws no
  text of its own (`text={() => null}`); its value is the tile's `h2`, so every tile reads
  the same way.

## Prompts

```
Can you clone this repo and use the skill within it and the Digit MCP connector to build me an application and publish it to the Digit Staging - Digit org platform?

https://github.com/Digit-Technologies/digit-apps-starter

App to publish to:
- name: Production dashboard

What to build:
A single-page production dashboard for a manufacturing team to check at any time.

Data:
- Query Digit's dailyMetrics(startDate: DateTimeISO!, endDate: DateTimeISO!) for today plus the prior 7 days.
- Declare READ_ORGANIZATION_DETAIL_AND_METRICS in the app manifest permissions (required by dailyMetrics).
- Metrics: inventoryQuantityProduced, numMOsCompleted, percentMOsCompletedOnTime, numMOsOpenLate.
- Treat missing days or null values as no data — never fake zeros.
- Interpret "today" and day boundaries in the viewer's browser/device local timezone (apps have no org timezone field to read). Show the timezone abbreviation somewhere on the page so the basis is obvious.

Layout:
1) Top row — four KPI tiles with large numbers:
   - Units produced today, with a small delta vs the trailing 7-day average.
   - MOs completed today.
   - Percent of MOs completed on time as a ring/gauge, color-coded from good to needs attention.
   - MOs open and late as an alert tile (red/tinted background; lower is better).
2) Bottom row — two charts side by side (stack on narrow screens), using @mui/x-charts (fits the starter's React + MUI stack; no chart library is bundled):
   - 7-day line/area chart of units produced.
   - 7-day grouped bar chart of MOs completed vs MOs open late.
3) Header: title on the left; timezone text and a "Preview data" switch on the right, vertically centered with each other and with the title.

Charts & polish:
- Soft, translucent area fill under the units-produced line (not a solid black fill); rounded bar tops and a rounded gauge arc.
- High-contrast "Preview data" badge when preview mode is on so fake numbers are never mistaken for live data.

Behavior:
- Show a clear "No data" state per tile/chart when that metric is missing.
- Runtime toggle for Preview data (default off): when on, skip the live query and use stub metrics so the layout can be demoed without real manufacturing activity.
```

## Context supplied

- Started from `examples/full-featured` per the `create-digit-app` skill, then removed
  `src/backend` and the example tabs/panels since this app is Digit-API-only.
- Schema/permission lookups done live via the Digit Staging MCP resources
  (`graphql-schema://search/dailyMetrics`, `graphql-schema://type/Query`,
  `graphql-schema://type/DailyMetric`, `graphql-schema://type/MetricType`,
  `graphql-schema://type/MetricValue`, `graphql-schema://type/MetricNumber`,
  `graphql-schema://type/MetricPercentage`) and the `apiPermissions` tool.
- `@mui/x-charts@^9.11.1` added as a new dependency (`Gauge`, `LineChart`, `BarChart`) —
  confirmed compatible with the starter's pinned `@mui/material@^7.3.9` + React 18 via its
  published peerDependencies; no chart library ships in the starter template.
