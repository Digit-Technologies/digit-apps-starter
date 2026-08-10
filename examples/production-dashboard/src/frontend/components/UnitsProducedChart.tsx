import { useTheme } from '@mui/material/styles';
import { LineChart, lineClasses } from '@mui/x-charts/LineChart';

import ChartCard from './ChartCard';
import type { DayBucket } from '../dateWindow';

export type UnitsProducedChartProps = {
  days: DayBucket[];
  values: Array<number | null>;
  unitSymbol: string | null;
};

export default function UnitsProducedChart({ days, values, unitSymbol }: UnitsProducedChartProps) {
  const theme = useTheme();
  const hasAnyData = values.some((v) => v !== null);
  const title = unitSymbol
    ? `Units produced (last 8 days, ${unitSymbol})`
    : 'Units produced (last 8 days)';

  // A dedicated chart accent (theme.palette.info, a blue) instead of `primary.main` —
  // in this theme primary is near-black (it's the button/text accent, not a chart color),
  // which is what made the filled area look like a solid black wedge. The line stays a
  // solid, fully-opaque stroke for precise reading; only the area fill underneath it is
  // toned way down via `fillOpacity`, so the shape/volume still reads at a glance without
  // dominating the tile.
  const lineColor = theme.palette.info.main;

  return (
    <ChartCard title={title} noData={!hasAnyData}>
      <LineChart
        height={280}
        xAxis={[
          {
            data: days.map((day) => day.label),
            scaleType: 'point',
          },
        ]}
        series={[
          {
            data: values,
            area: true,
            showMark: true,
            label: unitSymbol ? `Units produced (${unitSymbol})` : 'Units produced',
            color: lineColor,
            connectNulls: false,
          },
        ]}
        sx={{
          [`& .${lineClasses.area}`]: {
            fillOpacity: 0.18,
          },
        }}
        grid={{ horizontal: true }}
        hideLegend
      />
    </ChartCard>
  );
}
