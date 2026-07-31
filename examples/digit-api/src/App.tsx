import { useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type ItemNode = { id: string; name?: string | null; sku?: string | null };

type ItemsResult = {
  data?: {
    items?: {
      nodes?: ItemNode[];
    };
  };
  errors?: Array<{ message: string }>;
  error?: { code: string; message: string };
};

const ITEMS_QUERY = `
  query Items($connection: ConnectionInput) {
    items(connection: $connection) {
      nodes {
        id
        name
        sku
      }
    }
  }
`;

type LoadState =
  | { status: 'loading' }
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'loaded'; nodes: ItemNode[] };

async function loadItems(): Promise<LoadState> {
  const client = window.DigitProxyClient;
  if (!client) {
    return {
      status: 'unavailable',
      message: 'DigitProxyClient is unavailable. This page only works inside the Digit app harness.',
    };
  }

  try {
    const result = (await client.callProxy({
      query: ITEMS_QUERY,
      variables: { connection: { first: 10 } },
    })) as ItemsResult;

    if (result.error) {
      return { status: 'error', message: `${result.error.code}: ${result.error.message}` };
    }
    if (result.errors?.length) {
      return { status: 'error', message: result.errors.map((e) => e.message).join('; ') };
    }

    const nodes = result.data?.items?.nodes ?? [];
    return nodes.length ? { status: 'loaded', nodes } : { status: 'empty' };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Request failed' };
  }
}

export default function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    void loadItems().then(setState);
  }, []);

  return (
    <Box sx={{ maxWidth: '40rem', mx: 'auto', px: 3, py: 5 }}>
      <Typography variant="overline" component="p" sx={{ color: 'primary.main', mb: 1 }}>
        Digit API
      </Typography>
      <Typography variant="h1" component="h1" sx={{ mb: 1 }}>
        Items
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
        Loaded through <code>DigitProxyClient</code> (never a browser token).
      </Typography>

      {state.status === 'loading' && (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <CircularProgress size={18} />
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Loading…
          </Typography>
        </Stack>
      )}

      {state.status === 'unavailable' && <Alert severity="info">{state.message}</Alert>}
      {state.status === 'error' && <Alert severity="error">{state.message}</Alert>}
      {state.status === 'empty' && (
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          No items found.
        </Typography>
      )}

      {state.status === 'loaded' && (
        <List sx={{ mt: 1 }}>
          {state.nodes.map((item) => (
            <ListItem
              key={item.id}
              disableGutters
              sx={{
                bgcolor: 'background.surface',
                borderRadius: 1,
                mb: 1,
                px: 2,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <ListItemText primary={item.name ?? 'Untitled'} />
              <Typography
                variant="body2"
                component="span"
                sx={{ color: 'text.secondary', fontFamily: 'monospace' }}
              >
                {item.sku ?? item.id}
              </Typography>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
