import Box from '@mui/material/Box';
import { useTheme, type Theme } from '@mui/material/styles';
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';

import KpiTile from './KpiTile';

export type OnTimeGaugeTileProps = {
  todayValue: number | null;
};

/** Good ≥ 90%, needs attention < 70%, otherwise a middle "watch" state. */
function colorForPercent(percent: number, theme: Theme): string {
  if (percent >= 90) return theme.palette.success.main;
  if (percent >= 70) return theme.palette.warning.main;
  return theme.palette.error.main;
}

export default function OnTimeGaugeTile({ todayValue }: OnTimeGaugeTileProps) {
  const theme = useTheme();

  if (todayValue === null) {
    return <KpiTile label="MOs completed on time" noData />;
  }

  const clamped = Math.max(0, Math.min(100, todayValue));
  const color = colorForPercent(clamped, theme);

  return (
    <KpiTile label="MOs completed on time">
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Gauge
          width={140}
          height={110}
          value={clamped}
          valueMin={0}
          valueMax={100}
          startAngle={-110}
          endAngle={110}
          cornerRadius="50%"
          text={({ value }) => `${Math.round(value ?? 0)}%`}
          sx={{
            [`& .${gaugeClasses.valueArc}`]: { fill: color },
            [`& .${gaugeClasses.valueText}`]: {
              fontSize: 22,
              fontWeight: 700,
            },
          }}
        />
      </Box>
    </KpiTile>
  );
}
