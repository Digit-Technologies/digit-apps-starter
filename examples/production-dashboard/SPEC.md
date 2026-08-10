# SPEC: Production Dashboard

## What it does

Single-page production dashboard for a manufacturing team to check at a glance. Fetches
`dailyMetrics` for today plus the prior 7 days (8 calendar days total, in the viewer's
local timezone) and renders four KPI tiles (units produced today w/ delta vs trailing
7-day average, MOs completed today, percent MOs completed on time as a color-coded gauge,
MOs open & late as a tinted alert tile) plus two 8-day charts (line/area of units produced;
grouped bar of MOs completed vs. MOs open late). UI-only — no backend/Worker/D1.

"Today" and day boundaries are computed in the viewer's browser/device local timezone
(Digit apps have no org timezone field to read), and the resolved timezone abbreviation is
shown in the page header so the basis is obvious. Missing days or null values are rendered
as an explicit "No data" state, never faked as zero.

## Data & permissions

- `READ_ORGANIZATION_DETAIL_AND_METRICS` — required by `Query.dailyMetrics` (see
  `graphql-schema://type/Query` docstring). This key may not appear in the MCP
  `apiPermissions` list (scoped to API-token-grantable permissions); use the field's schema
  documentation as the authoritative source for what the resolver enforces.
- `dailyMetrics(startDate: DateTimeISO!, endDate: DateTimeISO!): [DailyMetric!]!` has no
  metric-type filter — it always returns every `MetricType`; the app filters client-side to
  the four it cares about (`inventoryQuantityProduced`, `numMOsCompleted`,
  `percentMOsCompletedOnTime`, `numMOsOpenLate`).
- `DailyMetric.valuesByDate[].value` is a `MetricValue` union (`MetricNumber { quantity }` /
  `MetricPercentage { percent }` for most metrics here); the query selects both via inline
  fragments plus `__typename`.
- A day with no data simply has no entry in `valuesByDate` for that date — it is not
  returned as an explicit null. The frontend pre-seeds all 8 expected day buckets as `null`
  and only fills in a bucket when a matching `date` (converted to a local calendar day) is
  found in the response.
- `inventoryQuantityProduced` resolves to `MetricMeasurements`, not `MetricNumber` — query
  `... on MetricMeasurements { measurements { value uom { symbol } } }`. Each day can
  report quantities in multiple units of measure; `buildMeasurementSeries`
  (`useDailyMetrics.ts`) picks the UoM with the largest total across the window as
  "primary" and sums only that UoM per day. A day present in the response with no
  measurement in that UoM is a real `0`; a day absent from the response entirely stays
  `null`. The resolved UoM symbol is surfaced as `inventoryQuantityProducedUnit` and shown
  next to the number in both the tile and the chart title.

## Prompts

```
Build a single-page production dashboard for a manufacturing team to check at any time.

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
2) Bottom row — two charts side by side (stack on narrow screens), using @mui/x-charts:
   - 8-day line/area chart of units produced.
   - 8-day grouped bar chart of MOs completed vs MOs open late.

Behavior:
- Show a clear "No data" state per tile/chart when that metric is missing.
```

## Context supplied

- Started from `examples/full-featured` per the `create-digit-app` skill, then removed
  `src/backend` and the example tabs/panels since this app is Digit-API-only.
- Schema and permission lookups via Digit MCP resources (`graphql-schema://search/dailyMetrics`,
  `graphql-schema://type/Query`, `graphql-schema://type/DailyMetric`,
  `graphql-schema://type/MetricType`, `graphql-schema://type/MetricValue`, etc.).
- `@mui/x-charts@^9.11.1` added for `Gauge`, `LineChart`, and `BarChart` — compatible with
  the starter's pinned `@mui/material@^7.3.9` + React 18 peer dependencies.
