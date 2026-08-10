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
  chart title.
- **Preview stub data (`previewStubData.ts`):** supplies realistic-but-fake 8-day numbers
  so the dashboard can be demoed/screenshotted without needing real manufacturing activity
  first. It's toggled at runtime via a "Preview data" switch in the header (state lives in
  `App.tsx`, passed into `useDailyMetrics(previewMode)`), defaulting to **off** — real
  `dailyMetrics` data is the default experience. When on, the real query is skipped
  entirely (`useDigitApiQuery({ ..., skip: previewMode })`) and a small "Preview data" chip
  renders next to the header so the fake numbers are never mistaken for live output.
- **Chart styling:** the units-produced area chart originally filled with
  `theme.palette.primary.main`, which in this theme is near-black (it's the button/text
  accent color, not a chart color) — at the default fill opacity of 1 that rendered as a
  solid black wedge. Fixed by switching the series color to `theme.palette.info.main` (a
  blue meant for this kind of accent) and knocking the area's `fillOpacity` down to `0.18`
  via `sx` targeting `` `.${lineClasses.area}` `` from `@mui/x-charts/LineChart` — the line
  itself stays fully opaque for precise reading, only the fill underneath is toned down.
  The bar chart uses `borderRadius={6}` (a direct `BarChart` prop) for rounded bar tops,
  and the gauge uses `cornerRadius="50%"` (a `Gauge` prop) for a fully rounded arc.
- **Header layout:** the title row uses `alignItems="center"` (not `"baseline"`) so the
  "Production Dashboard" heading vertically centers against the timezone-text/preview-switch
  block on the right, and that block's own inner `Stack` also uses `alignItems="center"` so
  the switch centers against the timezone text next to it — baseline alignment looked off
  for a `Switch`, which isn't text.

## Prompts

1. Original request:

```
Can you clone this repo and use the skill within it and the Digit MCP connector to build me an application and publish it to the Digit Staging - Digit org platform?

https://github.com/Digit-Technologies/digit-apps-starter

App to publish to:
- name: Unfulfilled
- id: 019feca6-d7fe-774b-8ee6-da1783ec21ea

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

Behavior:
- Show a clear "No data" state per tile/chart when that metric is missing.
```

2. Follow-up (correcting the target app):

```
Sorry the app name to publish to is "Production dashboard 2" I sent the wrong one in the original prompt
```

3. Follow-up (bug report, after the first publish):

```
Okay, the app works and looks great. I'm just noticing that I don't see any values from the response for this.

{
  "metricType": "inventoryQuantityProduced",
  "valuesByDate": [
    {
      "date": "2026-08-10T05:00:00.000Z",
      "value": {
        "__typename": "MetricMeasurements"
      }
    }
  ]
}

Is the query asking for the right information? I just closed some manufacturing orders that produced inventory, but I'm not seeing the charts update. They are updating for the fact that the manufacturing orders were completed, though.
```

4. Follow-up (requesting a screenshot-preview build, after being warned that the linked
   PR's `previewStubData.ts` is fake data meant to be removed before real use):

```
I'd like to wire in the stub data so I can take a screenshot of how it's going to look for someone to preview it.
```

5. Follow-up (after seeing the screenshot — requesting a runtime toggle instead of a
   code-level flag, plus a chart styling pass):

```
Is it possible to just add in a toggle to show the preview versus the real data?

And can we make the UI for this graph a little bit prettier? The black fill is kind of dramatic. I'm not sure if we need to fill, or if we do, because it's valuable for some reason. Maybe adding transparency to make it less drastic. Curious what's more readable for the graph: fast fill versus align, and why you would choose one or the other.
```

6. Follow-up (contrast on the preview-data badge):

```
This is beautiful. Can you just change the color of this preview data badge to add more contrast? It's easier to read.
```

7. Follow-up (alignment + rounded corners):

```
Can you vertically center the switch with the time zone text, and then also vertically center the production data title with that top right section that has the time zone and preview data switch?

And is it also possible to add some border radius on the graph bars and the gauge?
```

## Context supplied

- Started from `examples/full-featured` per the `create-digit-app` skill, then removed
  `src/backend` and the example tabs/panels since this app is Digit-API-only.
- Schema/permission lookups done live via the Digit Staging MCP resources
  (`graphql-schema://search/dailyMetrics`, `graphql-schema://type/Query`,
  `graphql-schema://type/DailyMetric`, `graphql-schema://type/MetricType`,
  `graphql-schema://type/MetricValue`, `graphql-schema://type/MetricNumber`,
  `graphql-schema://type/MetricPercentage`) and the `apiPermissions` tool.
- Target app id resolved via the MCP `apps` tool by matching on name, not trusted from the
  user-supplied id (the id given in the original prompt matched no existing app; the
  corrected name "Production dashboard 2" matched app id
  `019fecab-6ed5-730e-8f54-b6d69e8edca2`, created shortly before this session).
- `@mui/x-charts@^9.11.1` added as a new dependency (`Gauge`, `LineChart`, `BarChart`) —
  confirmed compatible with the starter's pinned `@mui/material@^7.3.9` + React 18 via its
  published peerDependencies; no chart library ships in the starter template.
