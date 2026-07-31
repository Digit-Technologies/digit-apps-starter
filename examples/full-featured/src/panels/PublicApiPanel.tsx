import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { AppErrorAlert, useBackendQuery } from '@digit/app-frontend';

type WeatherData = {
  latitude: number;
  longitude: number;
  temperatureF: number | null;
  weatherCode: number | null;
  observedAt: string | null;
};

export default function PublicApiPanel() {
  const { data, error, loading, refetch } = useBackendQuery<WeatherData>({
    path: '/weather',
    skip: true,
  });

  return (
    <Stack spacing={2}>
      <Typography variant="h2" component="h2">
        Public API
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        Worker calls Open-Meteo (no API key). The browser never talks to the third party — only{' '}
        <code>/proxy/backend/weather</code>.
      </Typography>

      <Button
        variant="contained"
        onClick={() => void refetch()}
        disabled={loading}
        sx={{ alignSelf: 'flex-start' }}
      >
        Fetch weather (NYC)
      </Button>

      {loading && (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Calling backend…
          </Typography>
        </Stack>
      )}

      {error && <AppErrorAlert error={error} onRetry={() => void refetch()} />}

      {data && (
        <Stack spacing={0.5}>
          <Typography variant="body1">
            Temperature: <strong>{data.temperatureF ?? '—'}°F</strong>
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Weather code {data.weatherCode ?? '—'} · observed {data.observedAt ?? '—'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {data.latitude}, {data.longitude}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}
