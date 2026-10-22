import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

import KpiTile from './KpiTile';

const numberFormatter = new Intl.NumberFormat('en-US');

export type OpenLateTileProps = {
  todayValue: number | null;
  loading?: boolean;
};

export default function OpenLateTile({ todayValue, loading }: OpenLateTileProps) {
  // The state is a pill (`Chip`), never a tinted card or red number (design-system.md › Pill).
  const footer =
    todayValue === null ? undefined : (
      <>
        {todayValue > 0 ? (
          <Chip size="small" color="red" label="Needs attention" />
        ) : (
          <Chip size="small" color="green" label="On track" />
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
