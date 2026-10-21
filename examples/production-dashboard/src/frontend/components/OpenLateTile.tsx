import Typography from '@mui/material/Typography';

import { Pill } from '@digit/lib-frontend';

import KpiTile from './KpiTile';

const numberFormatter = new Intl.NumberFormat('en-US');

export type OpenLateTileProps = {
  todayValue: number | null;
  loading?: boolean;
};

export default function OpenLateTile({ todayValue, loading }: OpenLateTileProps) {
  // The state is a Pill, never a tinted card or red number (design-system.md › Pill).
  const footer =
    todayValue === null ? undefined : (
      <>
        {todayValue > 0 ? (
          <Pill size="sm" color="red" label="Needs attention" />
        ) : (
          <Pill size="sm" color="green" label="On track" />
        )}
        <Typography variant="overline" color="text.tertiary">
          Lower is better
        </Typography>
      </>
    );

  return (
    <KpiTile
      title="MOs open & late"
      loading={loading}
      value={todayValue === null ? null : numberFormatter.format(todayValue)}
      footer={footer}
    />
  );
}
