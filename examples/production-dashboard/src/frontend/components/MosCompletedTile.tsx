import KpiTile from './KpiTile';

const numberFormatter = new Intl.NumberFormat('en-US');

export type MosCompletedTileProps = {
  todayValue: number | null;
  loading?: boolean;
};

export default function MosCompletedTile({ todayValue, loading }: MosCompletedTileProps) {
  return (
    <KpiTile
      title="MOs completed"
      loading={loading}
      value={todayValue === null ? null : numberFormatter.format(todayValue)}
    />
  );
}
