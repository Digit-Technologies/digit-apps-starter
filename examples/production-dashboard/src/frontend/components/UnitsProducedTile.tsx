import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import KpiTile from './KpiTile';

const numberFormatter = new Intl.NumberFormat('en-US');

export type UnitsProducedTileProps = {
  /** Full series (oldest → newest, today last). */
  values: Array<number | null>;
  /** Unit-of-measure symbol, e.g. "ea", "kg" — null when no data. */
  unitSymbol: string | null;
};

export default function UnitsProducedTile({ values, unitSymbol }: UnitsProducedTileProps) {
  const theme = useTheme();
  const today = values.at(-1) ?? null;
  const priorDays = values.slice(0, -1);
  const priorValues = priorDays.filter((v): v is number => v !== null);
  const trailingAverage =
    priorValues.length > 0 ? priorValues.reduce((sum, v) => sum + v, 0) / priorValues.length : null;

  if (today === null) {
    return <KpiTile label="Units produced today" noData />;
  }

  const delta = trailingAverage !== null ? today - trailingAverage : null;
  const deltaColor =
    delta === null
      ? 'text.tertiary'
      : delta > 0
        ? theme.palette.success.main
        : delta < 0
          ? theme.palette.error.main
          : 'text.tertiary';
  const deltaSign = delta !== null && delta > 0 ? '+' : '';
  const unitSuffix = unitSymbol ? ` ${unitSymbol}` : '';

  return (
    <KpiTile label="Units produced today">
      <Typography variant="h2" component="p" sx={{ fontWeight: 700 }}>
        {numberFormatter.format(today)}
        {unitSymbol && (
          <Typography component="span" variant="h5" sx={{ color: 'text.tertiary', ml: 0.75 }}>
            {unitSymbol}
          </Typography>
        )}
      </Typography>
      <Stack direction="row" spacing={0.5} alignItems="baseline" sx={{ mt: 0.5 }}>
        {delta !== null ? (
          <>
            <Typography variant="body2" sx={{ color: deltaColor, fontWeight: 600 }}>
              {deltaSign}
              {numberFormatter.format(Math.round(delta))}
              {unitSuffix}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.tertiary' }}>
              vs 7-day avg ({numberFormatter.format(Math.round(trailingAverage as number))}
              {unitSuffix})
            </Typography>
          </>
        ) : (
          <Typography variant="caption" sx={{ color: 'text.tertiary' }}>
            No 7-day average available
          </Typography>
        )}
      </Stack>
    </KpiTile>
  );
}
