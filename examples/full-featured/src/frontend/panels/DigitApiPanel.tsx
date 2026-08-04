import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { AppErrorAlert, useDigitApiQuery } from '@digit/lib-frontend';

type ItemNode = { id: string; name?: string | null; sku?: string | null };

type ItemsData = {
  items?: { nodes?: ItemNode[] };
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

export default function DigitApiPanel() {
  const { data, error, loading, refetch } = useDigitApiQuery<ItemsData>({
    query: ITEMS_QUERY,
    variables: { connection: { first: 10 } },
  });
  const nodes = data?.items?.nodes ?? [];

  return (
    <Stack spacing={2}>
      <Typography variant="h2" component="h2">
        Digit API
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        <code>useDigitApiQuery</code> from <code>@digit/lib-frontend</code> with{' '}
        <code>READ_ITEM</code>. Platform vs GraphQL errors are normalized for{' '}
        <code>AppErrorAlert</code>.
      </Typography>

      {loading && (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Loading items…
          </Typography>
        </Stack>
      )}

      {error && <AppErrorAlert error={error} onRetry={() => void refetch()} />}

      {!loading && !error && nodes.length === 0 && (
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          No items returned.
        </Typography>
      )}

      {!loading && !error && nodes.length > 0 && (
        <List dense>
          {nodes.map((node) => (
            <ListItem key={node.id} disableGutters>
              <ListItemText
                primary={node.name || 'Untitled'}
                secondary={node.sku ? `SKU ${node.sku}` : node.id}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Stack>
  );
}
