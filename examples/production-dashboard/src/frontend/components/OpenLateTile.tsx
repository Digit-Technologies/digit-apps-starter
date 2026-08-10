import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import KpiTile from './KpiTile';

const numberFormatter = new Intl.NumberFormat('en-US');

export type OpenLateTileProps = {
  todayValue: number | null;
};

export default function OpenLateTile({ todayValue }: OpenLateTileProps) {
  const theme = useTheme();

  if (todayValue === null) {
    return <KpiTile label="MOs open & late" noData />;
  }

  const needsAttention = todayValue > 0;
  const bgcolor = needsAttention
    ? alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.16 : 0.08)
    : undefined;
  const numberColor = needsAttention ? theme.palette.error.main : theme.palette.text.primary;

  return (
    <KpiTile label="MOs open & late" bgcolor={bgcolor}>
      <Typography variant="h2" component="p" sx={{ fontWeight: 700, color: numberColor }}>
        {numberFormatter.format(todayValue)}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.tertiary', mt: 0.5 }}>
        Lower is better
      </Typography>
    </KpiTile>
  );
}
