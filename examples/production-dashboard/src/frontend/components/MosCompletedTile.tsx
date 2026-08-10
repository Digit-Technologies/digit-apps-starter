import Typography from '@mui/material/Typography';

import KpiTile from './KpiTile';

const numberFormatter = new Intl.NumberFormat('en-US');

export type MosCompletedTileProps = {
  todayValue: number | null;
};

export default function MosCompletedTile({ todayValue }: MosCompletedTileProps) {
  if (todayValue === null) {
    return <KpiTile label="MOs completed today" noData />;
  }

  return (
    <KpiTile label="MOs completed today">
      <Typography variant="h2" component="p" sx={{ fontWeight: 700 }}>
        {numberFormatter.format(todayValue)}
      </Typography>
    </KpiTile>
  );
}
