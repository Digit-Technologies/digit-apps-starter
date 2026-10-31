import { useTheme } from '@mui/material/styles';
import { LineChart, lineClasses } from '@mui/x-charts/LineChart';

import ChartCard, { CHART_HEIGHT } from './ChartCard';
import type { DayBucket } from '../dateWindow';

export type UnitsProducedChartProps = {
  days: DayBucket[];
  values: Array<number | null>;
  unitSymbol: string | null;
  loading?: boolean;
};

export default function UnitsProducedChart({ days, values, unitSymbol, loading }: UnitsProducedChartProps) {
  const theme = useTheme();
  const hasAnyData = values.some((v) => v !== null);

  // Series colours come from the palette accents (theme.palette.<accent>.main), never hex and
  // never `primary` (charcoal, the action colour). The line stays opaque for precise reading;
  // only the area under it is toned down.
  return (
    <ChartCard
      title="Units produced"
      subtitle={unitSymbol ?? undefined}
      loading={loading}
      noData={!hasAnyData}
    >
      <LineChart
        height={CHART_HEIGHT}
        xAxis={[{ data: days.map((day) => day.label), scaleType: 'point' }]}
        series={[
          {
            data: values,
            area: true,
            showMark: true,
            label: unitSymbol ? `Units produced (${unitSymbol})` : 'Units produced',
            color: theme.palette.blue.main,
            connectNulls: false,
          },
        ]}
        sx={{ [`& .${lineClasses.area}`]: { fillOpacity: 0.16 } }}
        grid={{ horizontal: true }}
        hideLegend
      />
    </ChartCard>
  );
}
