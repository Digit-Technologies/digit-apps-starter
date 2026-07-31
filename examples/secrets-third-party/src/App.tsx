import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; ok: boolean; data: unknown }
  | { status: 'error'; message: string };

async function checkStatus(): Promise<LoadState> {
  try {
    const response = await fetch('/proxy/backend/external-status', {
      credentials: 'include',
      headers: { 'X-Digit-Proxy-Client': '1' },
    });
    const data = await response.json();
    return { status: 'done', ok: response.ok, data };
  } catch (error) {
    return {
      status: 'error',
      message:
        error instanceof Error ? error.message : 'Request failed (expected outside the Digit harness)',
    };
  }
}

export default function App() {
  const [state, setState] = useState<LoadState>({ status: 'idle' });

  const handleClick = () => {
    setState({ status: 'loading' });
    void checkStatus().then(setState);
  };

  return (
    <Box sx={{ maxWidth: '42rem', mx: 'auto', px: 3, py: 5 }}>
      <Typography variant="overline" component="p" sx={{ color: 'primary.main', mb: 1 }}>
        Secrets
      </Typography>
      <Typography variant="h1" component="h1" sx={{ mb: 1 }}>
        Third-party call
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
        The API key stays in Digit as an app secret, injected into the Worker as{' '}
        <code>env.THIRD_PARTY_API_KEY</code>. This UI only calls{' '}
        <code>/proxy/backend/external-status</code>.
      </Typography>

      <Button variant="contained" onClick={handleClick} disabled={state.status === 'loading'}>
        Check status
      </Button>

      <Stack spacing={1} sx={{ mt: 2 }}>
        {state.status === 'loading' && (
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Calling backend…
          </Typography>
        )}

        {state.status === 'error' && (
          <Typography variant="body1" sx={{ color: 'error.main' }}>
            {state.message}
          </Typography>
        )}

        {state.status === 'done' && (
          <>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              {state.ok ? 'Success' : 'HTTP error'}
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
          </>
        )}
      </Stack>
    </Box>
  );
}
