import { useState } from 'react';

import Box from '@mui/material/Box';

import { AppErrorAlert, PageBody, PageHeader, Pill, Section, Switch } from '@digit/lib-frontend';

import MosChart from './components/MosChart';
import MosCompletedTile from './components/MosCompletedTile';
import OnTimeGaugeTile from './components/OnTimeGaugeTile';
import OpenLateTile from './components/OpenLateTile';
import UnitsProducedChart from './components/UnitsProducedChart';
import UnitsProducedTile from './components/UnitsProducedTile';
import { localTimezoneAbbreviation } from './dateWindow';
import { useDailyMetrics } from './useDailyMetrics';

// Dashboard recipe (design-patterns.md › Dashboard): tiles are Cards in a grid with an 8px
// column gap and a 16px row gap, grouped under Section headings, inside PageBody on the grey page.
const tileGrid = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
  columnGap: 1,
  rowGap: 2,
} as const;

const chartGrid = {
  ...tileGrid,
  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
} as const;

export default function App() {
  // Real data by default; flip on to demo/screenshot the layout with realistic fake numbers.
  const [previewMode, setPreviewMode] = useState(false);
  const { days, series, inventoryQuantityProducedUnit, loading, error, refetch } =
    useDailyMetrics(previewMode);
  const tzAbbreviation = localTimezoneAbbreviation();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <PageHeader
        title="Production dashboard"
        titleAdornment={previewMode ? <Pill size="sm" label="Preview data" /> : undefined}
        actions={
          <Switch
            label="Preview data"
            checked={previewMode}
            onChange={(_, checked) => setPreviewMode(checked)}
          />
        }
      />
      <Box sx={{ flex: 1, bgcolor: 'background.secondary' }}>
        <PageBody>
          {error ? (
            <AppErrorAlert error={error} onRetry={() => void refetch()} />
          ) : (
            <>
              <Section title="Today" subtitle={`Day boundaries in your local time (${tzAbbreviation})`}>
                <Box sx={tileGrid}>
                  <UnitsProducedTile
                    loading={loading}
                    values={series.inventoryQuantityProduced}
                    unitSymbol={inventoryQuantityProducedUnit}
                  />
                  <MosCompletedTile loading={loading} todayValue={series.numMOsCompleted.at(-1) ?? null} />
                  <OnTimeGaugeTile
                    loading={loading}
                    todayValue={series.percentMOsCompletedOnTime.at(-1) ?? null}
                  />
                  <OpenLateTile loading={loading} todayValue={series.numMOsOpenLate.at(-1) ?? null} />
                </Box>
              </Section>

              <Section title="Last 8 days">
                <Box sx={chartGrid}>
                  <UnitsProducedChart
                    loading={loading}
                    days={days}
                    values={series.inventoryQuantityProduced}
                    unitSymbol={inventoryQuantityProducedUnit}
                  />
                  <MosChart
                    loading={loading}
                    days={days}
                    completedValues={series.numMOsCompleted}
                    openLateValues={series.numMOsOpenLate}
                  />
                </Box>
              </Section>
            </>
          )}
        </PageBody>
      </Box>
    </Box>
  );
}
