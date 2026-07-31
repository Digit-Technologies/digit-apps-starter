import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { AppErrorAlert, useBackendQuery } from '@digit/app-frontend';

type StatusData = {
  authenticated: boolean;
  tokenPrefix: string | null;
};

export default function SecretsPanel() {
  const { data, error, loading, refetch } = useBackendQuery<StatusData>('/external-status', {
    skip: true,
  });

  return (
    <Stack spacing={2}>
      <Typography variant="h2" component="h2">
        Secrets
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        Set env <code>API_BASE_URL</code> (e.g. <code>https://httpbin.org</code>) and secret{' '}
        <code>THIRD_PARTY_API_KEY</code> on the Digit app. The Worker uses the secret server-side
        and never returns it — only a short prefix for demo.
      </Typography>

      <Button
        variant="contained"
        onClick={() => void refetch()}
        disabled={loading}
        sx={{ alignSelf: 'flex-start' }}
      >
        Check external status
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
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body1">
            Authenticated: <strong>{data.authenticated ? 'yes' : 'no'}</strong>
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Token prefix: {data.tokenPrefix ?? '—'}
          </Typography>
        </Paper>
      )}
    </Stack>
  );
}
