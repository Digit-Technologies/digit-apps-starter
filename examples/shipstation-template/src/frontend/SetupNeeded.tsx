import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { SetupItem } from './setupTypes';

type SetupNeededProps = {
  items: SetupItem[];
  onRecheck: () => void;
  rechecking: boolean;
};

function statusChip({ item }: { item: SetupItem }) {
  if (!item.present) {
    return <Chip size="small" label={item.required ? 'Missing' : 'Not set'} color="warning" />;
  }
  if (!item.valid) {
    return <Chip size="small" label="Invalid" color="error" />;
  }
  if (!item.required) {
    return <Chip size="small" label="Set (optional)" color="success" variant="outlined" />;
  }
  return <Chip size="small" label="Ready" color="success" />;
}

function kindLabel(kind: SetupItem['kind']) {
  if (kind === 'secret') return 'Secret';
  if (kind === 'env') return 'Env var';
  return 'Database binding';
}

export default function SetupNeeded({ items, onRecheck, rechecking }: SetupNeededProps) {
  return (
    <Stack spacing={2.5}>
      <Alert severity="warning">
        This app cannot connect to ShipStation until the required secret and database binding
        are in place. Add them on the Digit app, republish if you changed the manifest, then
        recheck.
      </Alert>

      <Stack spacing={2} divider={<Divider />}>
        {items.map((item) => (
          <Stack key={item.key} spacing={0.75}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="subtitle1" component="h2" sx={{ fontFamily: 'monospace' }}>
                {item.key}
              </Typography>
              <Chip size="small" label={kindLabel(item.kind)} variant="outlined" />
              {item.required ? (
                <Chip size="small" label="Required" />
              ) : (
                <Chip size="small" label="Optional" variant="outlined" />
              )}
              {statusChip({ item })}
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {item.description}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Where: {item.where}
            </Typography>
            {item.issue && (!item.present || !item.valid) ? (
              <Typography variant="body2" sx={{ color: 'error.main' }}>
                {item.issue}
              </Typography>
            ) : null}
          </Stack>
        ))}
      </Stack>

      <Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
          After adding a secret or env var in Digit, reload this app. Database bindings apply
          on publish.
        </Typography>
        <Button variant="contained" onClick={onRecheck} disabled={rechecking}>
          {rechecking ? 'Checking…' : 'Recheck configuration'}
        </Button>
      </Box>
    </Stack>
  );
}
