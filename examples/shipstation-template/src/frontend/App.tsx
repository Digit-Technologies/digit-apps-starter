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
import type {
  CarrierDraft,
  OrgSettingsData,
} from './carrierTypes';
import {
  draftFromOrgSettings,
  mappingsFromDraft,
  unmatchedServicesFrom,
} from './carrierTypes';
import AppShell from './components/AppShell';
import CarrierSettingsDialog from './components/CarrierSettingsDialog';
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
    'Scheduled push sends eligible awaiting-carrier shipments to ShipStation every five minutes. Manual push only sends them when you click Refresh in the shipping queue.',
  defaultWeightOz:
    'Package weight sent to ShipStation on push. Digit shipments have no weight field, so this default applies to every push.',
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
  apiVersion?: 'v1' | 'v2' | string;
  mismatch?: string;
  /** Connection row exists but ShipStation secrets were removed — not operable. */
  credentialsMissing?: boolean;
  staleConnection?: boolean;
};

type SettingsDraft = {
  defaultFulfillmentMethod: string;
  defaultWeightOz: string;
};

function draftFromOrg(orgSettings: OrgSettingsData | undefined): SettingsDraft {
  return {
    defaultFulfillmentMethod: orgSettings?.defaultFulfillmentMethod === 'manual' ? 'manual' : 'scheduled',
    defaultWeightOz: String(orgSettings?.defaultWeightOz ?? 16),
  };
}

function setupProgressFrom(data: SetupData | undefined) {
  if (!data?.items?.length) return null;
  const required = data.items.filter((item) => item.required);
  const present = required.filter((item) => item.present).length;
  return { present, total: required.length };
}

export default function App() {
  const setupQuery = useBackendQuery<SetupData>({ path: '/setup' });
  const setupData = setupQuery.data;
  const apiTokenPresent = Boolean(setupData?.apiTokenPresent);
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
  const credentialsMissing = Boolean(
    connectionQuery.data?.credentialsMissing || connectionQuery.data?.staleConnection,
  );
  /** Secrets removed after connect leave a D1 row — do not show the queue until restored or disconnected. */
  const operable = connected && !credentialsMissing;
  const activityQuery = useActivityQuery(organizationId ?? '');

  const [mutate, { error: mutationError, loading: mutating, reset: resetMutation }] =
    useBackendMutation<ConnectionData>();
  const [checkSetup] = useBackendMutation<SetupData>();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [carrierSettingsOpen, setCarrierSettingsOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [setupCapabilitiesOpen, setSetupCapabilitiesOpen] = useState(false);
  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  const [carrierDraft, setCarrierDraft] = useState<CarrierDraft | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [connectBlocker, setConnectBlocker] = useState<string | null>(null);

  const connect = async () => {
    if (!organizationId) return;
    resetMutation();
    setSuccessNotice(null);
    setConnectBlocker(null);

    // Fresh setup read so we never POST when Digit secrets were just removed.
    const setupResult = await checkSetup({ path: '/setup', method: 'GET' });
    if (!setupResult.ok) {
      setConnectBlocker(
        setupResult.error.code === 'BACKEND_UNAVAILABLE'
          ? 'The app backend is unavailable, so Connect cannot check your ShipStation API key. Wait a moment and try again.'
          : setupResult.error.message ||
              'Could not verify ShipStation setup before connecting.',
      );
      await setupQuery.refetch();
      return;
    }
    await setupQuery.refetch();
    if (!setupResult.data?.shipStationKeyPresent) {
      setConnectBlocker(
        'No ShipStation API key is configured. Add SHIPSTATION_API_KEY to this app’s secrets in Digit (and SHIPSTATION_API_SECRET only for V1), then reload and connect.',
      );
      return;
    }

    const result = await mutate({
      path: '/connection',
      method: 'POST',
      body: { organizationId },
    });
    if (!result.ok) return;
    const carriers = result.data?.carrierCount ?? 0;
    const version = result.data?.apiVersion === 'v1' ? 'V1' : 'V2';
    setSuccessNotice(
      `Connected to ShipStation ${version} and synced ${carriers} carrier(s). Create Digit shipments, then push from the shipping queue to purchase a label.`,
    );
    await connectionQuery.refetch();
    await orgSettingsQuery.refetch();
  };

  const openSettings = () => {
    if (!operable) return;
    resetMutation();
    setSuccessNotice(null);
    setDraft(draftFromOrg(orgSettingsQuery.data));
    setSettingsOpen(true);
  };

  const openCarrierSettings = () => {
    if (!operable || !isAdmin) return;
    resetMutation();
    setSuccessNotice(null);
    setCarrierDraft(draftFromOrgSettings(orgSettingsQuery.data));
    setCarrierSettingsOpen(true);
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
        defaultWeightOz: Number(draft.defaultWeightOz),
      },
    });
    if (!orgResult.ok) return;
    setSettingsOpen(false);
    setSuccessNotice(
      'Settings saved. New pushes use these rules; orders already in ShipStation are unchanged.',
    );
    await orgSettingsQuery.refetch();
  };

  const saveCarrierMappings = async () => {
    if (!organizationId || !carrierDraft) return;
    resetMutation();
    if (orgSettingsQuery.data?.digitCarriersError) return;
    const orgResult = await mutate({
      path: '/org-settings',
      method: 'PATCH',
      body: {
        organizationId,
        mappings: mappingsFromDraft(carrierDraft),
      },
    });
    if (!orgResult.ok) return;
    setCarrierSettingsOpen(false);
    setSuccessNotice(
      'Carrier mapping saved. The next label writeback uses these Digit shipping carriers.',
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
    setCarrierSettingsOpen(false);
    setSuccessNotice(
      'Disconnected ShipStation. The shipping queue cannot push until you connect again. Shipment maps stay for audit.',
    );
    await connectionQuery.refetch();
    await orgSettingsQuery.refetch();
  };

  const loading =
    setupQuery.loading ||
    bootstrap.loading ||
    (!!organizationId && configLoaded && (connectionQuery.loading || orgSettingsQuery.loading));

  const showContent = !notPublished && !setupQuery.error;
  const backendUnavailable =
    setupQuery.error?.code === 'BACKEND_UNAVAILABLE' ||
    connectionQuery.error?.code === 'BACKEND_UNAVAILABLE' ||
    orgSettingsQuery.error?.code === 'BACKEND_UNAVAILABLE' ||
    mutationError?.code === 'BACKEND_UNAVAILABLE';
  const canOfferConnect = !backendUnavailable && !connectionQuery.error;
  const digitCarriersError = orgSettingsQuery.data?.digitCarriersError ?? null;
  const unmatchedServices = digitCarriersError ? [] : unmatchedServicesFrom(orgSettingsQuery.data);
  const unmatchedCarrierCount = unmatchedServices.length;
  const unmatchedCarrierLabel = unmatchedServices
    .map((row) => row.name || row.serviceCode)
    .filter(Boolean)
    .join(', ');
  /** A purchased label already used one of these, so a shipment is missing its Digit carrier. */
  const unmatchedOnLabel = digitCarriersError
    ? []
    : (orgSettingsQuery.data?.unmappedCarriers ?? []);
  const featureStatusProps = {
    connected: operable,
    apiTokenPresent,
    shipStationKeyPresent,
    shipStationApiMode: setupData?.shipStationApiMode,
    shipStationSecretPresent: Boolean(setupData?.shipStationSecretPresent),
    channels: setupData?.channels ?? [],
  };

  return (
    <AppShell
      commandBar={
        <ConnectionBar
          connected={connected}
          operable={operable}
          credentialsMissing={credentialsMissing}
          apiVersion={connectionQuery.data?.apiVersion}
          carrierCount={connectionQuery.data?.carrierCount}
          unmatchedCarrierCount={unmatchedCarrierCount}
          loading={loading}
          isAdmin={isAdmin}
          shipStationKeyPresent={shipStationKeyPresent}
          setupProgress={setupProgressFrom(setupData)}
          organizationId={organizationId}
          notPublished={notPublished}
          mutating={mutating}
          onConnect={() => void connect()}
          onOpenSettings={openSettings}
          onOpenCarrierSettings={openCarrierSettings}
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
      {connectBlocker ? (
        <Alert severity="warning" onClose={() => setConnectBlocker(null)}>
          {connectBlocker}
        </Alert>
      ) : null}
      {connectionQuery.data?.mismatch ? (
        <Alert severity="warning">{connectionQuery.data.mismatch}</Alert>
      ) : null}
      {credentialsMissing ? (
        <Alert severity="warning">
          ShipStation app secrets were removed, so this org is <strong>not connected</strong> even
          though a local connection record remains. Click <strong>Clear connection</strong> to remove
          it, or restore <strong>SHIPSTATION_API_KEY</strong> and reload.
        </Alert>
      ) : null}
      {successNotice ? (
        <Alert severity="success" onClose={() => setSuccessNotice(null)}>
          {successNotice}
        </Alert>
      ) : null}
      {operable && digitCarriersError ? (
        <Alert severity="warning">{digitCarriersError}</Alert>
      ) : null}
      {operable && unmatchedCarrierCount > 0 ? (
        <Alert
          severity={unmatchedOnLabel.length > 0 ? 'error' : 'warning'}
          action={
            isAdmin ? (
              <Button color="inherit" size="small" onClick={openCarrierSettings}>
                Map carriers
              </Button>
            ) : null
          }
        >
          {unmatchedOnLabel.length > 0
            ? `A purchased label used a ShipStation service that is not mapped to Digit (${unmatchedOnLabel
                .map((row) => row.serviceName || row.serviceCode || row.carrierName || row.carrierCode)
                .filter(Boolean)
                .join(', ')}), so those shipments have no Digit carrier. `
            : `${unmatchedCarrierCount} ShipStation service${
                unmatchedCarrierCount === 1 ? ' is' : 's are'
              } not mapped to a Digit shipping carrier (${unmatchedCarrierLabel}). Digit’s carrier stays empty when a label uses ${
                unmatchedCarrierCount === 1 ? 'it' : 'one of them'
              }. `}
          {isAdmin
            ? 'Open carrier mapping to choose a Digit shipping carrier for each service, or set a carrier default.'
            : 'An org admin must map it in carrier settings.'}
        </Alert>
      ) : null}

      {showContent && operable && organizationId ? (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <FulfillmentQueue
            organizationId={organizationId}
            canPush
            apiVersion={connectionQuery.data?.apiVersion ?? null}
            orgSettings={orgSettingsQuery.data ?? null}
            pushDisabledReason={
              apiTokenPresent ? null : 'Ask Digit staff to generate JWT_TOKEN and place it in this organization’s app secrets.'
            }
            onPushComplete={() => activityQuery.refetch()}
          />
        </Paper>
      ) : null}

      {showContent && !operable && isAdmin && organizationId && !loading ? (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <SectionHeader
            overline="Connection"
            title={credentialsMissing ? 'Connection inactive' : 'Connect your account'}
            description={
              credentialsMissing
                ? 'Secrets are missing. Clear the leftover connection, or restore the ShipStation API key and reload.'
                : 'Validate credentials (V2 key, or V1 key plus secret) and sync carriers before pushing shipments.'
            }
          />
          <Box sx={{ mt: 2 }}>
            {credentialsMissing ? (
              <Stack spacing={2}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  The shipping queue stays hidden until ShipStation credentials are live again.
                </Typography>
                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => {
                    resetMutation();
                    setSuccessNotice(null);
                    setDisconnectOpen(true);
                  }}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Clear connection
                </Button>
              </Stack>
            ) : !canOfferConnect ? (
              <Alert severity="warning">
                The app backend is unavailable right now, so Connect cannot verify your ShipStation
                API key. Use Retry on the error above, then try again.
              </Alert>
            ) : (
              <ConnectPanel
                shipStationKeyPresent={shipStationKeyPresent}
                mutating={mutating}
                onConnect={() => void connect()}
              />
            )}
          </Box>
        </Paper>
      ) : null}

      {showContent && !operable && !isAdmin && organizationId && !loading ? (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <NonAdminNotice connected={operable} />
        </Paper>
      ) : null}

      {showContent && operable && organizationId ? (
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

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} fullWidth maxWidth="md">
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
                    <MenuItem value="scheduled">Scheduled push</MenuItem>
                    <MenuItem value="manual">Manual push</MenuItem>
                  </Select>
                </FormControl>
              </SettingField>
              <SettingField title={SETTING_HINTS.defaultWeightOz} label="Default package weight">
                <TextField
                  label="Default weight (ounces)"
                  type="number"
                  value={draft.defaultWeightOz}
                  onChange={(event) => setDraft({ ...draft, defaultWeightOz: event.target.value })}
                  fullWidth
                  inputProps={{ min: 0.1, step: 0.1 }}
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

      <CarrierSettingsDialog
        open={carrierSettingsOpen}
        orgSettings={orgSettingsQuery.data}
        draft={carrierDraft ?? { defaults: {}, services: {} }}
        mutating={mutating}
        mutationError={mutationError}
        onChangeDefault={(ssCarrierCode, digitOptionId) =>
          setCarrierDraft((current) => ({
            defaults: { ...(current?.defaults ?? {}), [ssCarrierCode]: digitOptionId },
            services: current?.services ?? {},
          }))
        }
        onChangeService={(ssCarrierCode, ssServiceCode, digitOptionId) =>
          setCarrierDraft((current) => ({
            defaults: current?.defaults ?? {},
            services: {
              ...(current?.services ?? {}),
              [ssCarrierCode + '::' + ssServiceCode]: digitOptionId,
            },
          }))
        }
        onClose={() => setCarrierSettingsOpen(false)}
        onSave={() => void saveCarrierMappings()}
      />

      <Dialog open={disconnectOpen} onClose={() => setDisconnectOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Disconnect ShipStation?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            This disables ShipStation actions and soft-deletes the connection
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
