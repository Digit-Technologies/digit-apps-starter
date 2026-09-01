import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

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
  if (item.present && !item.valid) {
    return <Chip size="small" color="error" label="Failed" />;
  }
  if (item.present) {
    return (
      <Chip
        size="small"
        color="success"
        label={item.source === 'appDatabase' ? 'Live (legacy store)' : 'Live'}
      />
    );
  }
  return <Chip size="small" color="warning" variant="outlined" label="Missing" />;
}

export default function SetupNeeded({ items }: SetupNeededProps) {
  return (
    <Stack spacing={2.5}>
      <Alert severity="info">
        These are this organization’s app secrets in Digit. Add the missing values by clicking
        'Manage Custom Apps' and then 'Edit' for the ShipStation integration, then reload. Values
        are managed by Digit and are never entered or shown inside this app.
      </Alert>

      <Stack spacing={0}>
        {items.map((item, index) => (
          <Stack
            key={item.key}
            direction="row"
            spacing={2}
            sx={{
              py: 2,
              borderTop: index > 0 ? 1 : 0,
              borderColor: 'divider',
            }}
          >
            <Stack alignItems="center" spacing={0.5} sx={{ width: 32, flexShrink: 0 }}>
              {item.present ? (
                <CheckCircleOutlineIcon color="success" fontSize="small" />
              ) : (
                <RadioButtonUncheckedIcon sx={{ color: 'text.disabled' }} fontSize="small" />
              )}
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {index + 1}
              </Typography>
            </Stack>
            <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="subtitle1" component="h3">
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
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignSelf: 'flex-start',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'warning.main' }}>
                    Secret key to add:{' '}
                    <Typography component="span" variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {item.key}
                    </Typography>
                  </Typography>
                </Box>
              ) : null}
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
