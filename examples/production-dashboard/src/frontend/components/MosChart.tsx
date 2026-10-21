import { useTheme } from '@mui/material/styles';
import { BarChart } from '@mui/x-charts/BarChart';

import ChartCard, { CHART_HEIGHT } from './ChartCard';
import type { DayBucket } from '../dateWindow';

export type MosChartProps = {
  days: DayBucket[];
  completedValues: Array<number | null>;
  openLateValues: Array<number | null>;
  loading?: boolean;
};

export default function MosChart({ days, completedValues, openLateValues, loading }: MosChartProps) {
  const theme = useTheme();
  const hasAnyData =
    completedValues.some((v) => v !== null) || openLateValues.some((v) => v !== null);

  return (
    <ChartCard
      title="MOs completed vs. open & late"
      loading={loading}
      noData={!hasAnyData}
    >
      <BarChart
        height={CHART_HEIGHT}
        xAxis={[{ data: days.map((day) => day.label), scaleType: 'band' }]}
        series={[
          { data: completedValues, label: 'Completed', color: theme.palette.emerald.main },
          { data: openLateValues, label: 'Open & late', color: theme.palette.red.main },
        ]}
        grid={{ horizontal: true }}
      />
    </ChartCard>
  );
}
