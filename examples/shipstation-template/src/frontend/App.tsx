import { useState, type ReactNode } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import {
  AppErrorAlert,
  useBackendMutation,
  useBackendQuery,
  useDigitApiQuery,
} from '@digit/lib-frontend';

import FulfillmentQueue from './FulfillmentQueue';
import SetupNeeded from './SetupNeeded';
import type { SetupData } from './setupTypes';

type Permission = { key: string };

type BootstrapData = {
  currentPermissions?: Permission[] | null;
  organization?: { id: string } | null;
};

const BOOTSTRAP_QUERY = `
  query ShipStationBootstrap {
    currentPermissions { key }
    organization { id }
  }
`;

const ADMIN_PERMISSION = 'UPDATE_ORGANIZATION';

const OUT_OF_THE_BOX = [
  {
    title: 'Pick and pack in Digit',
    detail: 'Operators pick and pack in Digit, and can download sales-order, pick-list, and packing-slip PDFs.',
  },
  {
    title: 'Push orders to ShipStation',
    detail:
      'Eligible sales orders become ShipStation shipments. Push when fully packed, or as soon as inventory can fill the order.',
  },
  {
    title: 'Print labels in ShipStation',
    detail: 'Buy and print labels in ShipStation. This app does not rate-shop or purchase labels inside Digit.',
  },
  {
    title: 'Write tracking back to Digit',
    detail:
      'When ShipStation creates a label, tracking and carrier land on the Digit shipment so sales channels can be notified.',
  },
  {
    title: 'Hold orders that should not ship yet',
    detail:
      'Orders without available inventory are skipped. Optional tag filter and Manual fulfillment keep LTL or other 3PL orders in Digit.',
  },
  {
    title: 'Inbound ShipStation orders',
    detail:
      'Switch sync mode to import ShipStation shipments as Digit sales orders for drop-ship or ShipStation-first workflows.',
  },
  {
    title: 'Fulfillment queue',
    detail: 'See sync status per order, push or retry a batch, and download the Digit sales-order PDF.',
  },
] as const;

function OutOfTheBox() {
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle1" component="h2">
        Out of the box
      </Typography>
      <List disablePadding>
        {OUT_OF_THE_BOX.map((item) => (
          <ListItem key={item.title} alignItems="flex-start" disableGutters sx={{ py: 0.75 }}>
            <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
              <CheckCircleOutlineIcon color="primary" fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={item.title}
              secondary={item.detail}
              primaryTypographyProps={{ variant: 'body1', component: 'p' }}
              secondaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}

const SETTING_HINTS = {
  defaultFulfillmentMethod:
    'ShipStation pushes parcel orders to the connected account. Manual skips the push so those orders stay in Digit (for example LTL or another 3PL).',
  syncMode:
    'Digit to ShipStation creates ShipStation orders from Digit sales orders. ShipStation to Digit imports ShipStation shipments as Digit sales orders (for inbound or drop-ship workflows).',
  pushWhen:
    'Fully packed waits until Digit packing is complete (then operators print labels in ShipStation). Inventory available pushes as soon as stock can fill the order.',
  laneTagId:
    'Optional Digit sales-order tag option UUID. When set, only tagged orders are pushed. Leave blank to include every eligible order.',
} as const;

const settingTooltipSlotProps = {
  tooltip: {
    sx: {
      maxWidth: 320,
      whiteSpace: 'normal',
      display: 'block',
      textTransform: 'none',
      letterSpacing: 'normal',
      fontWeight: 400,
      lineHeight: 1.45,
      fontSize: 14,
      py: 1,
      px: 1.25,
    },
  },
};

function FieldHelp({ title, label }: { title: string; label: string }) {
  return (
    <Tooltip title={title} placement="left" enterTouchDelay={0} slotProps={settingTooltipSlotProps}>
      <IconButton type="button" size="small" aria-label={`About ${label}`} sx={{ color: 'text.secondary' }}>
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}

function SettingField({
  title,
  label,
  children,
}: {
  title: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      <FieldHelp title={title} label={label} />
    </Stack>
  );
}

type ConnectionData = {
  connected: boolean;
  organizationId?: string;
  id?: number;
  carrierCount?: number;
};

type OrgSettingsData = {
  organizationId: string;
  defaultFulfillmentMethod: string;
  syncMode: string;
  pushWhen: string;
  laneTagId: string | null;
};

type SettingsDraft = {
  defaultFulfillmentMethod: string;
  syncMode: string;
  pushWhen: string;
  laneTagId: string;
};

function draftFromOrg(orgSettings: OrgSettingsData | undefined): SettingsDraft {
  return {
    defaultFulfillmentMethod: orgSettings?.defaultFulfillmentMethod ?? 'unspecified',
    syncMode: orgSettings?.syncMode ?? 'digit_to_ss',
    pushWhen: orgSettings?.pushWhen ?? 'fully_packed',
    laneTagId: orgSettings?.laneTagId ?? '',
  };
}

export default function App() {
  const setupQuery = useBackendQuery<SetupData>({ path: '/setup' });
  const setupReady = Boolean(setupQuery.data?.ready);
  const setupBlocked =
    !setupQuery.loading && !setupQuery.error && setupQuery.data != null && !setupQuery.data.ready;

  const bootstrap = useDigitApiQuery<BootstrapData>({ query: BOOTSTRAP_QUERY });
  const organizationId = bootstrap.data?.organization?.id ?? null;
  const isAdmin = (bootstrap.data?.currentPermissions ?? []).some((permission) => {
    const key = permission.key;
    return key === ADMIN_PERMISSION || key === 'update:organization';
  });

  const connectionQuery = useBackendQuery<ConnectionData>({
    path: `/connection?organizationId=${encodeURIComponent(organizationId ?? '')}`,
    skip: !organizationId || !setupReady,
  });
  const orgSettingsQuery = useBackendQuery<OrgSettingsData>({
    path: `/org-settings?organizationId=${encodeURIComponent(organizationId ?? '')}`,
    skip: !organizationId || !setupReady,
  });
  const connected = Boolean(connectionQuery.data?.connected);

  const [mutate, { error: mutationError, loading: mutating, reset: resetMutation }] =
    useBackendMutation();

  const [apiKey, setApiKey] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [draft, setDraft] = useState<SettingsDraft | null>(null);

  const connect = async () => {
    if (!organizationId) return;
    resetMutation();
    const result = await mutate({
      path: '/connection',
      method: 'POST',
      body: { organizationId, apiKey },
    });
    if (!result.ok) return;
    setApiKey('');
    await connectionQuery.refetch();
    await orgSettingsQuery.refetch();
  };

  const openSettings = () => {
    if (!connectionQuery.data?.connected) return;
    resetMutation();
    setDraft(draftFromOrg(orgSettingsQuery.data));
    setSettingsOpen(true);
  };

  const saveSettings = async () => {
    if (!organizationId || !draft) return;
    resetMutation();
    const orgResult = await mutate({
      path: '/org-settings',
      method: 'PATCH',
      body: {
        organizationId,
        defaultFulfillmentMethod: draft.defaultFulfillmentMethod,
        syncMode: draft.syncMode,
        pushWhen: draft.pushWhen,
        laneTagId: draft.laneTagId.trim() === '' ? null : draft.laneTagId.trim(),
      },
    });
    if (!orgResult.ok) return;
    setSettingsOpen(false);
    await orgSettingsQuery.refetch();
  };

  const disconnect = async () => {
    if (!organizationId) return;
    resetMutation();
    const result = await mutate({
      path: '/connection',
      method: 'DELETE',
      body: { organizationId },
    });
    if (!result.ok) return;
    setDisconnectOpen(false);
    setSettingsOpen(false);
    await connectionQuery.refetch();
    await orgSettingsQuery.refetch();
  };

  const loading =
    setupQuery.loading ||
    (!setupBlocked &&
      (bootstrap.loading ||
        (!!organizationId && setupReady && (connectionQuery.loading || orgSettingsQuery.loading))));

  return (
    <Box sx={{ minHeight: '100vh', p: 3 }}>
      <Stack spacing={3} sx={{ width: '100%', maxWidth: 1100, mx: 'auto' }}>
        <Paper sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={2.5}>
            <Stack spacing={0.5}>
              <Typography variant="overline" component="p" sx={{ color: 'primary.main' }}>
                Digit App
              </Typography>
              <Typography variant="h1" component="h1">
                ShipStation
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                {setupBlocked
                  ? 'Paste the Digit API token and webhook URL below, then connect one ShipStation account.'
                  : connected
                    ? 'Pick and pack in Digit, then push orders so operators can print labels in ShipStation.'
                    : 'Connect one ShipStation account to start. Pick and pack stay in Digit; labels stay in ShipStation.'}
              </Typography>
            </Stack>

            {!connected ? (
              <>
                <Divider />
                <OutOfTheBox />
                <Divider />
              </>
            ) : null}

            {setupQuery.error && (
              <AppErrorAlert error={setupQuery.error} onRetry={() => void setupQuery.refetch()} />
            )}
            {setupBlocked && setupQuery.data ? (
              <SetupNeeded
                items={setupQuery.data.items}
                onSaved={() => setupQuery.refetch()}
              />
            ) : null}

            {!setupBlocked && !setupQuery.error && bootstrap.error && (
              <AppErrorAlert error={bootstrap.error} onRetry={() => void bootstrap.refetch()} />
            )}
            {!setupBlocked && !setupQuery.error && connectionQuery.error && (
              <AppErrorAlert
                error={connectionQuery.error}
                onRetry={() => void connectionQuery.refetch()}
              />
            )}
            {!setupBlocked && !setupQuery.error && orgSettingsQuery.error && (
              <AppErrorAlert
                error={orgSettingsQuery.error}
                onRetry={() => void orgSettingsQuery.refetch()}
              />
            )}
            {!setupBlocked && !setupQuery.error && mutationError && (
              <AppErrorAlert error={mutationError} />
            )}

            {setupBlocked || setupQuery.error ? null : loading ? (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Loading…
                </Typography>
              </Stack>
            ) : !organizationId ? (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Open this app inside Digit to load the organization and connect ShipStation.
              </Typography>
            ) : !isAdmin ? (
              <Stack spacing={1.5}>
                <Chip
                  label={connected ? 'Connected' : 'Not connected'}
                  color={connected ? 'success' : 'default'}
                  sx={{ alignSelf: 'flex-start' }}
                />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Only org admins can connect or change ShipStation settings. You can still work
                  the fulfillment queue when an account is connected.
                </Typography>
              </Stack>
            ) : connected ? (
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip label="Connected" color="success" />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {connectionQuery.data?.carrierCount ?? 0} carriers synced
                  </Typography>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<SettingsOutlinedIcon />}
                    onClick={openSettings}
                  >
                    Settings
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<LinkOffIcon />}
                    onClick={() => {
                      resetMutation();
                      setDisconnectOpen(true);
                    }}
                  >
                    Disconnect
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Stack
                spacing={2}
                component="form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void connect();
                }}
              >
                <TextField
                  label="ShipStation V2 API key"
                  type="password"
                  autoComplete="off"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  fullWidth
                  helperText="Paste a V2 key from ShipStation → Settings → API. It is validated live before it is saved."
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!apiKey.trim() || mutating}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  {mutating ? 'Connecting…' : 'Connect'}
                </Button>
              </Stack>
            )}
          </Stack>
        </Paper>

        {!setupBlocked && connected && organizationId ? (
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <FulfillmentQueue organizationId={organizationId} canPush />
          </Paper>
        ) : null}
      </Stack>

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>ShipStation settings</DialogTitle>
        <DialogContent>
          {draft && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <SettingField
                title={SETTING_HINTS.defaultFulfillmentMethod}
                label="Default fulfillment method"
              >
                <FormControl fullWidth>
                  <InputLabel id="fulfillment-label">Default fulfillment method</InputLabel>
                  <Select
                    labelId="fulfillment-label"
                    label="Default fulfillment method"
                    value={draft.defaultFulfillmentMethod}
                    onChange={(event) =>
                      setDraft({ ...draft, defaultFulfillmentMethod: event.target.value })
                    }
                  >
                    <MenuItem value="unspecified">Unspecified</MenuItem>
                    <MenuItem value="shipstation">ShipStation</MenuItem>
                    <MenuItem value="manual">Manual</MenuItem>
                  </Select>
                </FormControl>
              </SettingField>
              <SettingField title={SETTING_HINTS.syncMode} label="Sync mode">
                <FormControl fullWidth>
                  <InputLabel id="sync-label">Sync mode</InputLabel>
                  <Select
                    labelId="sync-label"
                    label="Sync mode"
                    value={draft.syncMode}
                    onChange={(event) => setDraft({ ...draft, syncMode: event.target.value })}
                  >
                    <MenuItem value="digit_to_ss">Digit to ShipStation</MenuItem>
                    <MenuItem value="ss_to_digit">ShipStation to Digit</MenuItem>
                  </Select>
                </FormControl>
              </SettingField>
              <SettingField title={SETTING_HINTS.pushWhen} label="Push when">
                <FormControl fullWidth>
                  <InputLabel id="push-when-label">Push when</InputLabel>
                  <Select
                    labelId="push-when-label"
                    label="Push when"
                    value={draft.pushWhen}
                    onChange={(event) => setDraft({ ...draft, pushWhen: event.target.value })}
                  >
                    <MenuItem value="fully_packed">Fully packed</MenuItem>
                    <MenuItem value="inventory_available">Inventory available</MenuItem>
                  </Select>
                </FormControl>
              </SettingField>
              <SettingField title={SETTING_HINTS.laneTagId} label="Lane tag">
                <TextField
                  label="Lane tag ID (optional)"
                  value={draft.laneTagId}
                  onChange={(event) => setDraft({ ...draft, laneTagId: event.target.value })}
                  fullWidth
                  helperText="Digit tag option UUID. Blank = all eligible orders."
                />
              </SettingField>
              {mutationError && <AppErrorAlert error={mutationError} />}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void saveSettings()} disabled={mutating}>
            {mutating ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={disconnectOpen} onClose={() => setDisconnectOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Disconnect ShipStation?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            This disables ShipStation actions, deregisters webhooks, and soft-deletes the
            connection and carrier catalog. Existing label and order-map records stay for audit.
            Reconnect creates a new connection and re-syncs carriers.
          </Typography>
          {mutationError && (
            <Box sx={{ mt: 2 }}>
              <AppErrorAlert error={mutationError} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisconnectOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => void disconnect()} disabled={mutating}>
            {mutating ? 'Disconnecting…' : 'Disconnect'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
