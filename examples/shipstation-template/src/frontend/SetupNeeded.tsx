import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { SetupItem } from './setupTypes';

const TOKEN_KEY = 'API_TOKEN_DIGIT';
const WEBHOOK_KEY = 'PUBLIC_WEBHOOK_URL';
const SHIPSTATION_KEY = 'SHIPSTATION_API_KEY';

type SetupNeededProps = {
  items: SetupItem[];
};

function fieldLabel(item: SetupItem) {
  if (item.key === TOKEN_KEY) return 'Digit API token';
  if (item.key === WEBHOOK_KEY) return 'Webhook URL';
  if (item.key === SHIPSTATION_KEY) return 'ShipStation API key';
  return item.key;
}

function statusChip({ item }: { item: SetupItem }) {
  if (item.present) {
    return (
      <Chip
        size="small"
        color="success"
        label={item.source === 'appDatabase' ? 'Live (legacy store)' : 'Live'}
      />
    );
  }
  return <Chip size="small" color="warning" label="Missing" />;
}

export default function SetupNeeded({ items }: SetupNeededProps) {
  return (
    <Stack spacing={2.5}>
      <Alert severity="info">
        These are this organization’s app secrets in Digit. Add the missing values by clicking
        'Manage Custom Apps' and then 'Edit' for the ShipStation integration, then reload. Values
        are managed by Digit and are never entered or shown inside this app.
      </Alert>

      <Stack spacing={2} divider={<Divider />}>
        {items.map((item) => (
          <Stack key={item.key} spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="subtitle1" component="h2">
                {fieldLabel(item)}
              </Typography>
              {statusChip({ item })}
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {item.description}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Enables: {item.enables}
            </Typography>
            {!item.present ? (
              <Typography variant="body2" sx={{ color: 'warning.main' }}>
                Secret key to add: <strong>{item.key}</strong>
              </Typography>
            ) : null}
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
