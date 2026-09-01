import { useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { AppErrorAlert, useBackendMutation } from '@digit/lib-frontend';

import type { SetupItem } from './setupTypes';

type SetupNeededProps = {
  items: SetupItem[];
  onSaved: () => Promise<void>;
};

function statusChip({ item }: { item: SetupItem }) {
  if (!item.present) {
    return <Chip size="small" label="Missing" color="warning" />;
  }
  if (!item.valid) {
    return <Chip size="small" label="Invalid" color="error" />;
  }
  return <Chip size="small" label="Saved" color="success" />;
}

function fieldLabel(item: SetupItem) {
  if (item.key === 'API_TOKEN_DIGIT') return 'Digit API token';
  if (item.key === 'PUBLIC_WEBHOOK_URL') return 'Webhook URL';
  return item.key;
}

export default function SetupNeeded({ items, onSaved }: SetupNeededProps) {
  const [apiTokenDigit, setApiTokenDigit] = useState('');
  const [publicWebhookUrl, setPublicWebhookUrl] = useState('');
  const [save, { error, loading, reset }] = useBackendMutation();

  const tokenItem = items.find((item) => item.key === 'API_TOKEN_DIGIT');
  const webhookItem = items.find((item) => item.key === 'PUBLIC_WEBHOOK_URL');

  const saveConfig = async () => {
    reset();
    const result = await save({
      path: '/setup',
      method: 'POST',
      body: {
        apiTokenDigit,
        publicWebhookUrl,
      },
    });
    if (!result.ok) return;
    setApiTokenDigit('');
    setPublicWebhookUrl('');
    await onSaved();
  };

  return (
    <Stack spacing={2.5}>
      <Alert severity="info">
        Paste the Digit API token and this app’s public webhook URL below. They are stored in this
        app and never shown again.
      </Alert>

      {error ? <AppErrorAlert error={error} /> : null}

      <Stack spacing={2} divider={<Divider />}>
        {items.map((item) => (
          <Stack key={item.key} spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="subtitle1" component="h2">
                {fieldLabel(item)}
              </Typography>
              {item.required ? <Chip size="small" label="Required" /> : null}
              {statusChip({ item })}
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {item.description}
            </Typography>
            {item.issue && (!item.present || !item.valid) ? (
              <Typography variant="body2" sx={{ color: 'error.main' }}>
                {item.issue}
              </Typography>
            ) : null}
            {item.key === 'API_TOKEN_DIGIT' ? (
              <TextField
                label={tokenItem?.present ? 'Replace token' : 'Digit API token'}
                type="password"
                value={apiTokenDigit}
                onChange={(event) => setApiTokenDigit(event.target.value)}
                autoComplete="off"
                fullWidth
                helperText={
                  tokenItem?.present ? 'Leave blank to keep the token already saved.' : undefined
                }
              />
            ) : null}
            {item.key === 'PUBLIC_WEBHOOK_URL' ? (
              <TextField
                label={webhookItem?.present ? 'Replace webhook URL' : 'https://…/webhooks/shipstation'}
                value={publicWebhookUrl}
                onChange={(event) => setPublicWebhookUrl(event.target.value)}
                autoComplete="off"
                fullWidth
                helperText={
                  webhookItem?.present ? 'Leave blank to keep the URL already saved.' : undefined
                }
              />
            ) : null}
          </Stack>
        ))}
      </Stack>

      <Box>
        <Button variant="contained" onClick={() => void saveConfig()} disabled={loading}>
          {loading ? 'Saving…' : 'Save configuration'}
        </Button>
      </Box>
    </Stack>
  );
}
