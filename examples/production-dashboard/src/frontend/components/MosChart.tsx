import { useTheme } from '@mui/material/styles';
import { BarChart } from '@mui/x-charts/BarChart';

import ChartCard from './ChartCard';
import type { DayBucket } from '../dateWindow';

export type MosChartProps = {
  days: DayBucket[];
  completedValues: Array<number | null>;
  openLateValues: Array<number | null>;
};

export default function MosChart({ days, completedValues, openLateValues }: MosChartProps) {
  const theme = useTheme();
  const hasAnyData =
    completedValues.some((v) => v !== null) || openLateValues.some((v) => v !== null);

  return (
    <ChartCard title="MOs completed vs. open late (last 8 days)" noData={!hasAnyData}>
      <BarChart
        height={280}
        xAxis={[
          {
            data: days.map((day) => day.label),
            scaleType: 'band',
          },
        ]}
        series={[
          {
            data: completedValues,
            label: 'Completed',
            color: theme.palette.success.main,
          },
          {
            data: openLateValues,
            label: 'Open & late',
            color: theme.palette.error.main,
          },
        ]}
        grid={{ horizontal: true }}
      />
    </ChartCard>
  );
}
