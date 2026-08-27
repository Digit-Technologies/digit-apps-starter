import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import LinkOffIcon from '@mui/icons-material/LinkOff';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import {
  AppErrorAlert,
  useBackendMutation,
  useBackendQuery,
  useDigitApiQuery,
} from '@digit/lib-frontend';

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

type Measurement = { value: number; unit: string };

type ConnectionDefaults = {
  defaultCarrierId: number | null;
  defaultServiceId: number | null;
  fallbackWeight: Measurement;
  fallbackLength: Measurement;
  fallbackWidth: Measurement;
  fallbackHeight: Measurement;
};

type ConnectionData = {
  connected: boolean;
  organizationId?: string;
  id?: number;
  rateTiming?: string;
  rateMode?: string;
  bestRateStrategy?: string;
  addCostToShippingFees?: boolean;
  autoSendReturnEmail?: boolean;
  blockOnInvalidAddress?: boolean;
  defaults?: ConnectionDefaults;
  carrierCount?: number;
  createdAt?: string;
};

type Service = {
  id: number;
  carrierId: number;
  serviceCode: string;
  name: string;
};

type Carrier = {
  id: number;
  shipstationCarrierId: string;
  carrierCode: string | null;
  name: string;
  services: Service[];
};

type CarriersData = { carriers: Carrier[] };

type OrgSettingsData = {
  organizationId: string;
  defaultFulfillmentMethod: string;
};

type SettingsDraft = {
  rateTiming: string;
  rateMode: string;
  bestRateStrategy: string;
  addCostToShippingFees: boolean;
  autoSendReturnEmail: boolean;
  blockOnInvalidAddress: boolean;
  defaultCarrierId: number | '';
  defaultServiceId: number | '';
  fallbackWeight: string;
  fallbackLength: string;
  fallbackWidth: string;
  fallbackHeight: string;
  defaultFulfillmentMethod: string;
};

function draftFromConnection(
  connection: ConnectionData,
  orgSettings: OrgSettingsData | undefined,
): SettingsDraft {
  const defaults = connection.defaults;
  return {
    rateTiming: connection.rateTiming ?? 'shipping',
    rateMode: connection.rateMode ?? 'rate_shop',
    bestRateStrategy: connection.bestRateStrategy ?? 'cheapest',
    addCostToShippingFees: Boolean(connection.addCostToShippingFees),
    autoSendReturnEmail: Boolean(connection.autoSendReturnEmail),
    blockOnInvalidAddress: Boolean(connection.blockOnInvalidAddress),
    defaultCarrierId: defaults?.defaultCarrierId ?? '',
    defaultServiceId: defaults?.defaultServiceId ?? '',
    fallbackWeight: String(defaults?.fallbackWeight?.value ?? 1),
    fallbackLength: String(defaults?.fallbackLength?.value ?? 6),
    fallbackWidth: String(defaults?.fallbackWidth?.value ?? 4),
    fallbackHeight: String(defaults?.fallbackHeight?.value ?? 2),
    defaultFulfillmentMethod: orgSettings?.defaultFulfillmentMethod ?? 'unspecified',
  };
}

export default function App() {
  const bootstrap = useDigitApiQuery<BootstrapData>({ query: BOOTSTRAP_QUERY });
  const organizationId = bootstrap.data?.organization?.id ?? null;
  const isAdmin = (bootstrap.data?.currentPermissions ?? []).some((permission) => {
    const key = permission.key;
    return key === ADMIN_PERMISSION || key === 'update:organization';
  });

  const connectionQuery = useBackendQuery<ConnectionData>({
    path: `/connection?organizationId=${encodeURIComponent(organizationId ?? '')}`,
    skip: !organizationId,
  });
  const orgSettingsQuery = useBackendQuery<OrgSettingsData>({
    path: `/org-settings?organizationId=${encodeURIComponent(organizationId ?? '')}`,
    skip: !organizationId,
  });
  const connected = Boolean(connectionQuery.data?.connected);
  const carriersQuery = useBackendQuery<CarriersData>({
    path: `/carriers?organizationId=${encodeURIComponent(organizationId ?? '')}`,
    skip: !organizationId || !connected,
  });

  const [mutate, { error: mutationError, loading: mutating, reset: resetMutation }] =
    useBackendMutation();

  const [apiKey, setApiKey] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [draft, setDraft] = useState<SettingsDraft | null>(null);

  const carriers = carriersQuery.data?.carriers ?? [];
  const selectedCarrier = useMemo(
    () => carriers.find((carrier) => carrier.id === draft?.defaultCarrierId) ?? null,
    [carriers, draft?.defaultCarrierId],
  );

  const refreshAll = async () => {
    await Promise.all([
      connectionQuery.refetch(),
      orgSettingsQuery.refetch(),
      connected ? carriersQuery.refetch() : Promise.resolve(),
    ]);
  };

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
    await carriersQuery.refetch();
  };

  const openSettings = () => {
    if (!connectionQuery.data?.connected) return;
    resetMutation();
    setDraft(draftFromConnection(connectionQuery.data, orgSettingsQuery.data));
    setSettingsOpen(true);
  };

  const saveSettings = async () => {
    if (!organizationId || !draft) return;
    resetMutation();
    const weight = Number(draft.fallbackWeight);
    const length = Number(draft.fallbackLength);
    const width = Number(draft.fallbackWidth);
    const height = Number(draft.fallbackHeight);
    const settingsResult = await mutate({
      path: '/connection/settings',
      method: 'PATCH',
      body: {
        organizationId,
        rateTiming: draft.rateTiming,
        rateMode: draft.rateMode,
        bestRateStrategy: draft.bestRateStrategy,
        addCostToShippingFees: draft.addCostToShippingFees,
        autoSendReturnEmail: draft.autoSendReturnEmail,
        blockOnInvalidAddress: draft.blockOnInvalidAddress,
        defaults: {
          defaultCarrierId: draft.defaultCarrierId === '' ? null : draft.defaultCarrierId,
          defaultServiceId: draft.defaultServiceId === '' ? null : draft.defaultServiceId,
          fallbackWeight: { value: Number.isFinite(weight) ? weight : 1, unit: 'ounce' },
          fallbackLength: { value: Number.isFinite(length) ? length : 6, unit: 'inch' },
          fallbackWidth: { value: Number.isFinite(width) ? width : 4, unit: 'inch' },
          fallbackHeight: { value: Number.isFinite(height) ? height : 2, unit: 'inch' },
        },
      },
    });
    if (!settingsResult.ok) return;
    const orgResult = await mutate({
      path: '/org-settings',
      method: 'PATCH',
      body: {
        organizationId,
        defaultFulfillmentMethod: draft.defaultFulfillmentMethod,
      },
    });
    if (!orgResult.ok) return;
    setSettingsOpen(false);
    await refreshAll();
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
    bootstrap.loading ||
    (!!organizationId && (connectionQuery.loading || orgSettingsQuery.loading));

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
      <Paper sx={{ width: '100%', maxWidth: 640, p: { xs: 3, sm: 5 } }}>
        <Stack spacing={2.5}>
          <Stack spacing={0.5}>
            <Typography variant="overline" component="p" sx={{ color: 'primary.main' }}>
              Digit App
            </Typography>
            <Typography variant="h1" component="h1">
              ShipStation
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Connect one ShipStation account for this organization. API keys are encrypted on
              the server and never returned to the browser.
            </Typography>
          </Stack>

          {bootstrap.error && (
            <AppErrorAlert error={bootstrap.error} onRetry={() => void bootstrap.refetch()} />
          )}
          {connectionQuery.error && (
            <AppErrorAlert
              error={connectionQuery.error}
              onRetry={() => void connectionQuery.refetch()}
            />
          )}
          {orgSettingsQuery.error && (
            <AppErrorAlert
              error={orgSettingsQuery.error}
              onRetry={() => void orgSettingsQuery.refetch()}
            />
          )}
          {carriersQuery.error && connected && (
            <AppErrorAlert
              error={carriersQuery.error}
              onRetry={() => void carriersQuery.refetch()}
            />
          )}
          {mutationError && <AppErrorAlert error={mutationError} />}

          {loading ? (
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
                Only org admins can connect or change ShipStation settings.
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
            <Stack spacing={2} component="form" onSubmit={(event) => {
              event.preventDefault();
              void connect();
            }}>
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

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>ShipStation settings</DialogTitle>
        <DialogContent>
          {draft && (
            <Stack spacing={2} sx={{ mt: 1 }}>
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
              <FormControl fullWidth>
                <InputLabel id="timing-label">Rate-shop timing</InputLabel>
                <Select
                  labelId="timing-label"
                  label="Rate-shop timing"
                  value={draft.rateTiming}
                  onChange={(event) => setDraft({ ...draft, rateTiming: event.target.value })}
                >
                  <MenuItem value="order_creation">Order creation</MenuItem>
                  <MenuItem value="shipping">Shipping</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="mode-label">Rate mode</InputLabel>
                <Select
                  labelId="mode-label"
                  label="Rate mode"
                  value={draft.rateMode}
                  onChange={(event) => setDraft({ ...draft, rateMode: event.target.value })}
                >
                  <MenuItem value="rate_shop">Rate shop</MenuItem>
                  <MenuItem value="best_rate">Best rate</MenuItem>
                  <MenuItem value="strict_default">Strict default</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="strategy-label">Best-rate strategy</InputLabel>
                <Select
                  labelId="strategy-label"
                  label="Best-rate strategy"
                  value={draft.bestRateStrategy}
                  onChange={(event) =>
                    setDraft({ ...draft, bestRateStrategy: event.target.value })
                  }
                >
                  <MenuItem value="cheapest">Cheapest</MenuItem>
                  <MenuItem value="fastest">Fastest</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="carrier-label">Default carrier</InputLabel>
                <Select
                  labelId="carrier-label"
                  label="Default carrier"
                  value={draft.defaultCarrierId === '' ? '' : String(draft.defaultCarrierId)}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      defaultCarrierId: event.target.value === '' ? '' : Number(event.target.value),
                      defaultServiceId: '',
                    })
                  }
                >
                  <MenuItem value="">None</MenuItem>
                  {carriers.map((carrier) => (
                    <MenuItem key={carrier.id} value={String(carrier.id)}>
                      {carrier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="service-label">Default service</InputLabel>
                <Select
                  labelId="service-label"
                  label="Default service"
                  value={draft.defaultServiceId === '' ? '' : String(draft.defaultServiceId)}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      defaultServiceId:
                        event.target.value === '' ? '' : Number(event.target.value),
                    })
                  }
                >
                  <MenuItem value="">None</MenuItem>
                  {(selectedCarrier?.services ?? []).map((service) => (
                    <MenuItem key={service.id} value={String(service.id)}>
                      {service.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label="Fallback weight (oz)"
                  value={draft.fallbackWeight}
                  onChange={(event) => setDraft({ ...draft, fallbackWeight: event.target.value })}
                  fullWidth
                />
                <TextField
                  label="Length (in)"
                  value={draft.fallbackLength}
                  onChange={(event) => setDraft({ ...draft, fallbackLength: event.target.value })}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label="Width (in)"
                  value={draft.fallbackWidth}
                  onChange={(event) => setDraft({ ...draft, fallbackWidth: event.target.value })}
                  fullWidth
                />
                <TextField
                  label="Height (in)"
                  value={draft.fallbackHeight}
                  onChange={(event) => setDraft({ ...draft, fallbackHeight: event.target.value })}
                  fullWidth
                />
              </Stack>
              <FormControlLabel
                control={
                  <Switch
                    checked={draft.addCostToShippingFees}
                    onChange={(event) =>
                      setDraft({ ...draft, addCostToShippingFees: event.target.checked })
                    }
                  />
                }
                label="Add label cost to SO shipping fees"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={draft.autoSendReturnEmail}
                    onChange={(event) =>
                      setDraft({ ...draft, autoSendReturnEmail: event.target.checked })
                    }
                  />
                }
                label="Auto-send return-label email"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={draft.blockOnInvalidAddress}
                    onChange={(event) =>
                      setDraft({ ...draft, blockOnInvalidAddress: event.target.checked })
                    }
                  />
                }
                label="Block on invalid address (off = warn, override allowed)"
              />
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
            connection and carrier catalog. Existing label records stay for audit. Reconnect
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
    </Box>
  );
}
