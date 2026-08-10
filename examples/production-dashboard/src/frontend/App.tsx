import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { AppErrorAlert } from '@digit/lib-frontend';

import ChartCard from './components/ChartCard';
import MosChart from './components/MosChart';
import MosCompletedTile from './components/MosCompletedTile';
import OnTimeGaugeTile from './components/OnTimeGaugeTile';
import OpenLateTile from './components/OpenLateTile';
import UnitsProducedChart from './components/UnitsProducedChart';
import UnitsProducedTile from './components/UnitsProducedTile';
import { localTimezoneAbbreviation } from './dateWindow';
import { useDailyMetrics } from './useDailyMetrics';

export default function App() {
  const { days, series, inventoryQuantityProducedUnit, loading, error, refetch } = useDailyMetrics();
  const tzAbbreviation = localTimezoneAbbreviation();

  return (
    <Box sx={{ maxWidth: '72rem', mx: 'auto', px: 3, py: 4 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'baseline' }}
        spacing={0.5}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="overline" component="p" sx={{ color: 'primary.main', mb: 0.5 }}>
            Digit App
          </Typography>
          <Typography variant="h1" component="h1">
            Production Dashboard
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Today &amp; day boundaries shown in your local time ({tzAbbreviation})
        </Typography>
      </Stack>

      {error && (
        <Box sx={{ mb: 3 }}>
          <AppErrorAlert error={error} onRetry={() => void refetch()} />
        </Box>
      )}

      {loading && !error && (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Loading today&rsquo;s metrics…
          </Typography>
        </Stack>
      )}

      {!error && (
        <>
          <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              {loading ? (
                <ChartCard title="Units produced today" noData noDataMessage="Loading…" />
              ) : (
                <UnitsProducedTile
                  values={series.inventoryQuantityProduced}
                  unitSymbol={inventoryQuantityProducedUnit}
                />
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              {loading ? (
                <ChartCard title="MOs completed today" noData noDataMessage="Loading…" />
              ) : (
                <MosCompletedTile todayValue={series.numMOsCompleted.at(-1) ?? null} />
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              {loading ? (
                <ChartCard title="MOs completed on time" noData noDataMessage="Loading…" />
              ) : (
                <OnTimeGaugeTile todayValue={series.percentMOsCompletedOnTime.at(-1) ?? null} />
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              {loading ? (
                <ChartCard title="MOs open & late" noData noDataMessage="Loading…" />
              ) : (
                <OpenLateTile todayValue={series.numMOsOpenLate.at(-1) ?? null} />
              )}
            </Grid>
          </Grid>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              {loading ? (
                <ChartCard title="Units produced (last 8 days)" noData noDataMessage="Loading…" />
              ) : (
                <UnitsProducedChart
                  days={days}
                  values={series.inventoryQuantityProduced}
                  unitSymbol={inventoryQuantityProducedUnit}
                />
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {loading ? (
                <ChartCard
                  title="MOs completed vs. open late (last 8 days)"
                  noData
                  noDataMessage="Loading…"
                />
              ) : (
                <MosChart
                  days={days}
                  completedValues={series.numMOsCompleted}
                  openLateValues={series.numMOsOpenLate}
                />
              )}
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
