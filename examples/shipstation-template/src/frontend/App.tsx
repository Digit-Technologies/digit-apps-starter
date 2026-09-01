import { useState, type ReactNode } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import {
  AppErrorAlert,
  useBackendMutation,
  useBackendQuery,
  useDigitApiQuery,
} from '@digit/lib-frontend';

import ActivityLog, { useActivityQuery } from './ActivityLog';
import AppShell from './components/AppShell';
import ConnectionBar, { ConnectPanel, NonAdminNotice } from './components/ConnectionBar';
import SectionHeader from './components/SectionHeader';
import SetupCapabilitiesDialog from './components/SetupCapabilitiesDialog';
import FulfillmentQueue from './FulfillmentQueue';
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

function setupProgressFrom(data: SetupData | undefined) {
  if (!data?.items?.length) return null;
  const present = data.items.filter((item) => item.present).length;
  return { present, total: data.items.length };
}

export default function App() {
  const setupQuery = useBackendQuery<SetupData>({ path: '/setup' });
  const setupData = setupQuery.data;
  const apiTokenPresent = Boolean(setupData?.apiTokenPresent);
  const webhookUrlPresent = Boolean(setupData?.webhookUrlPresent);
  const shipStationKeyPresent = Boolean(setupData?.shipStationKeyPresent);
  const setupIncomplete = setupData != null && !setupData.ready;
  const notPublished = setupData != null && !setupData.usable;

  const bootstrap = useDigitApiQuery<BootstrapData>({ query: BOOTSTRAP_QUERY });
  const organizationId = bootstrap.data?.organization?.id ?? null;
  const isAdmin = (bootstrap.data?.currentPermissions ?? []).some((permission) => {
    const key = permission.key;
    return key === ADMIN_PERMISSION || key === 'update:organization';
  });

  const configLoaded = setupData != null && setupData.usable;
  const connectionQuery = useBackendQuery<ConnectionData>({
    path: `/connection?organizationId=${encodeURIComponent(organizationId ?? '')}`,
    skip: !organizationId || !configLoaded,
  });
  const orgSettingsQuery = useBackendQuery<OrgSettingsData>({
    path: `/org-settings?organizationId=${encodeURIComponent(organizationId ?? '')}`,
    skip: !organizationId || !configLoaded,
  });
  const connected = Boolean(connectionQuery.data?.connected);
  const activityQuery = useActivityQuery(organizationId ?? '');

  const [mutate, { error: mutationError, loading: mutating, reset: resetMutation }] =
    useBackendMutation<ConnectionData>();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [setupCapabilitiesOpen, setSetupCapabilitiesOpen] = useState(false);
  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const connect = async () => {
    if (!organizationId) return;
    resetMutation();
    setSuccessNotice(null);
    const result = await mutate({
      path: '/connection',
      method: 'POST',
      body: { organizationId },
    });
    if (!result.ok) return;
    const carriers = result.data?.carrierCount ?? 0;
    setSuccessNotice(
      `Connected to ShipStation and synced ${carriers} carrier(s). Pick and pack stay in Digit; print labels in ShipStation after you push orders from the queue.`,
    );
    await connectionQuery.refetch();
    await orgSettingsQuery.refetch();
  };

  const openSettings = () => {
    if (!connectionQuery.data?.connected) return;
    resetMutation();
    setSuccessNotice(null);
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
    setSuccessNotice(
      'Settings saved. New pushes use these rules; orders already in ShipStation are unchanged.',
    );
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
    setSuccessNotice(
      'Disconnected ShipStation. The fulfillment queue cannot push until you connect again. Order maps stay for audit.',
    );
    await connectionQuery.refetch();
    await orgSettingsQuery.refetch();
  };

  const loading =
    setupQuery.loading ||
    bootstrap.loading ||
    (!!organizationId && configLoaded && (connectionQuery.loading || orgSettingsQuery.loading));

  const showContent = !notPublished && !setupQuery.error;
  const featureStatusProps = {
    connected,
    apiTokenPresent,
    webhookUrlPresent,
    shipStationKeyPresent,
    channels: setupData?.channels ?? [],
  };

  return (
    <AppShell
      commandBar={
        <ConnectionBar
          connected={connected}
          carrierCount={connectionQuery.data?.carrierCount}
          loading={loading}
          isAdmin={isAdmin}
          shipStationKeyPresent={shipStationKeyPresent}
          setupProgress={setupProgressFrom(setupData)}
          organizationId={organizationId}
          notPublished={notPublished}
          mutating={mutating}
          onConnect={() => void connect()}
          onOpenSettings={openSettings}
          onOpenDisconnect={() => {
            resetMutation();
            setSuccessNotice(null);
            setDisconnectOpen(true);
          }}
          onOpenSetupCapabilities={() => setSetupCapabilitiesOpen(true)}
        />
      }
    >
      {setupQuery.error && (
        <AppErrorAlert error={setupQuery.error} onRetry={() => void setupQuery.refetch()} />
      )}
      {notPublished && (
        <Alert severity="error">
          This app is not fully published, so its backend has no database. Republish it, then reload.
        </Alert>
      )}
      {bootstrap.error && (
        <AppErrorAlert error={bootstrap.error} onRetry={() => void bootstrap.refetch()} />
      )}
      {connectionQuery.error && (
        <AppErrorAlert error={connectionQuery.error} onRetry={() => void connectionQuery.refetch()} />
      )}
      {orgSettingsQuery.error && (
        <AppErrorAlert error={orgSettingsQuery.error} onRetry={() => void orgSettingsQuery.refetch()} />
      )}
      {mutationError && <AppErrorAlert error={mutationError} />}
      {successNotice ? (
        <Alert severity="success" onClose={() => setSuccessNotice(null)}>
          {successNotice}
        </Alert>
      ) : null}

      {showContent && connected && organizationId ? (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <FulfillmentQueue
            organizationId={organizationId}
            canPush
            orgSettings={orgSettingsQuery.data ?? null}
            pushDisabledReason={
              apiTokenPresent ? null : 'Add the Digit API token to push orders to ShipStation.'
            }
            onPushComplete={() => activityQuery.refetch()}
          />
        </Paper>
      ) : null}

      {showContent && !connected && isAdmin && organizationId && !loading ? (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <SectionHeader
            overline="Connection"
            title="Connect your account"
            description="Validate your API key and register webhooks before pushing orders."
          />
          <Box sx={{ mt: 2 }}>
            <ConnectPanel
              shipStationKeyPresent={shipStationKeyPresent}
              mutating={mutating}
              onConnect={() => void connect()}
            />
          </Box>
        </Paper>
      ) : null}

      {showContent && !connected && !isAdmin && organizationId && !loading ? (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <NonAdminNotice connected={connected} />
        </Paper>
      ) : null}

      {showContent && connected && organizationId ? (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <ActivityLog query={activityQuery} />
        </Paper>
      ) : null}

      <SetupCapabilitiesDialog
        open={setupCapabilitiesOpen}
        onClose={() => setSetupCapabilitiesOpen(false)}
        showSetup={Boolean(setupIncomplete && setupData && isAdmin)}
        setupItems={setupData?.items ?? []}
        featureStatus={featureStatusProps}
      />

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
            {mutating ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={disconnectOpen} onClose={() => setDisconnectOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Disconnect ShipStation?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            This disables ShipStation actions, deregisters webhooks, and soft-deletes the connection
            and carrier catalog. Existing label and order-map records stay for audit. Reconnect
            creates a new connection and re-syncs carriers.
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
    </AppShell>
  );
}
