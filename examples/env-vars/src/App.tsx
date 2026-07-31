import { useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type Greeting = { message: string; source: string };

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; data: Greeting };

async function loadGreeting(): Promise<LoadState> {
  try {
    const response = await fetch('/proxy/backend/greeting', {
      credentials: 'include',
      headers: { 'X-Digit-Proxy-Client': '1' },
    });
    if (!response.ok) {
      return { status: 'error', message: `Backend returned ${response.status}` };
    }
    const data = (await response.json()) as Greeting;
    return { status: 'loaded', data };
  } catch (error) {
    return {
      status: 'error',
      message:
        error instanceof Error ? error.message : 'Request failed (expected outside the Digit harness)',
    };
  }
}

export default function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    void loadGreeting().then(setState);
  }, []);

  return (
    <Box sx={{ maxWidth: '42rem', mx: 'auto', px: 3, py: 5 }}>
      <Typography variant="overline" component="p" sx={{ color: 'primary.main', mb: 1 }}>
        Env vars
      </Typography>
      <Typography variant="h1" component="h1" sx={{ mb: 1 }}>
        Backend config
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
        Non-secret values are set on the app in Digit and read by the Worker via{' '}
        <code>env.WELCOME_MESSAGE</code>. The frontend only sees them through{' '}
        <code>/proxy/backend</code>.
      </Typography>

      {state.status === 'loading' && (
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Loading…
        </Typography>
      )}

      {state.status === 'error' && <Alert severity="error">{state.message}</Alert>}

      {state.status === 'loaded' && (
        <Stack spacing={1}>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Loaded from Worker env
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: 'background.surface',
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
            }}
          >
            <pre style={{ margin: 0 }}>{JSON.stringify(state.data, null, 2)}</pre>
          </Paper>
        </Stack>
      )}
    </Box>
  );
}
