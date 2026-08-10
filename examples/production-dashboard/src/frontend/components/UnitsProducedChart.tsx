import { useTheme } from '@mui/material/styles';
import { LineChart } from '@mui/x-charts/LineChart';

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
            color: theme.palette.primary.main,
            connectNulls: false,
          },
        ]}
        grid={{ horizontal: true }}
        hideLegend
      />
    </ChartCard>
  );
}
