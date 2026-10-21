import Typography from '@mui/material/Typography';

import { Pill } from '@digit/lib-frontend';

import KpiTile from './KpiTile';

const numberFormatter = new Intl.NumberFormat('en-US');

export type UnitsProducedTileProps = {
  /** Full series (oldest → newest, today last). */
  values: Array<number | null>;
  /** Unit-of-measure symbol, e.g. "ea", "kg" — null when no data. */
  unitSymbol: string | null;
  loading?: boolean;
};

export default function UnitsProducedTile({ values, unitSymbol, loading }: UnitsProducedTileProps) {
  const today = values.at(-1) ?? null;
  const priorDays = values.slice(0, -1);
  const priorValues = priorDays.filter((v): v is number => v !== null);
  const trailingAverage =
    priorValues.length > 0 ? priorValues.reduce((sum, v) => sum + v, 0) / priorValues.length : null;
  const unitSuffix = unitSymbol ? ` ${unitSymbol}` : '';

  let footer;
  if (today !== null && trailingAverage !== null) {
    const delta = Math.round(today - trailingAverage);
    // The trend is a Pill (category colour only appears inside a Pill), not coloured text.
    const color = delta > 0 ? 'green' : delta < 0 ? 'red' : 'gray';
    footer = (
      <>
        <Pill
          size="sm"
          color={color}
          label={`${delta > 0 ? '+' : ''}${numberFormatter.format(delta)}${unitSuffix}`}
        />
        <Typography variant="overline" color="text.tertiary">
          vs 7-day avg of {numberFormatter.format(Math.round(trailingAverage))}
          {unitSuffix}
        </Typography>
      </>
    );
  } else if (today !== null) {
    footer = (
      <Typography variant="overline" color="text.tertiary">
        No 7-day average yet
      </Typography>
    );
  }

  return (
    <KpiTile
      title="Units produced"
      loading={loading}
      value={today === null ? null : numberFormatter.format(today)}
      unit={today === null ? null : unitSymbol}
      footer={footer}
    />
  );
}
