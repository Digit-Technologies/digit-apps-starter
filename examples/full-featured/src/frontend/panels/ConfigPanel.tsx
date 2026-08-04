import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { AppErrorAlert, useBackendQuery } from '@digit/lib-frontend';

type GreetingData = { message: string };

export default function ConfigPanel() {
  const { data, error, loading, refetch } = useBackendQuery<GreetingData>({ path: '/greeting' });

  return (
    <Stack spacing={2}>
      <Typography variant="h2" component="h2">
        Config
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        Reads non-secret env <code>WELCOME_MESSAGE</code> from the Worker. Missing config
        surfaces as <code>MISSING_CONFIG</code>.
      </Typography>

      <Button
        variant="outlined"
        onClick={() => void refetch()}
        disabled={loading}
        sx={{ alignSelf: 'flex-start' }}
      >
        Refresh
      </Button>

      {loading && (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Loading greeting…
          </Typography>
        </Stack>
      )}

      {error && <AppErrorAlert error={error} onRetry={() => void refetch()} />}

      {!loading && !error && data && (
        <Typography variant="h3" component="p">
          {data.message}
        </Typography>
      )}
    </Stack>
  );
}
