import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import LinkOffIcon from '@mui/icons-material/LinkOff';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';

import { motionTransition } from './motion';

export type ConnectionBarProps = {
  connected: boolean;
  /** Connection can call ShipStation (secrets present). */
  operable?: boolean;
  credentialsMissing?: boolean;
  apiVersion?: 'v1' | 'v2' | string | null;
  carrierCount?: number;
  loading: boolean;
  isAdmin: boolean;
  shipStationKeyPresent: boolean;
  setupProgress?: { present: number; total: number } | null;
  organizationId: string | null;
  notPublished: boolean;
  mutating: boolean;
  onConnect: () => void;
  onOpenSettings: () => void;
  onOpenDisconnect: () => void;
  onOpenSetupCapabilities: () => void;
};

function connectedLabel(apiVersion?: 'v1' | 'v2' | string | null) {
  if (apiVersion === 'v1') return 'Connected (V1)';
  if (apiVersion === 'v2') return 'Connected (V2)';
  return 'Connected';
}

export default function ConnectionBar({
  connected,
  operable = connected,
  credentialsMissing = false,
  apiVersion = null,
  carrierCount = 0,
  loading,
  isAdmin,
  shipStationKeyPresent,
  setupProgress,
  organizationId,
  notPublished,
  mutating,
  onConnect,
  onOpenSettings,
  onOpenDisconnect,
  onOpenSetupCapabilities,
}: ConnectionBarProps) {
  const setupIncomplete =
    setupProgress != null && setupProgress.present < setupProgress.total;

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 1.5, md: 2 }}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
      >
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '1.35rem', sm: '1.5rem' } }}>
            ShipStation
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {operable
              ? 'Pick and pack in Digit, push orders, print labels in ShipStation.'
              : credentialsMissing
                ? 'Connection inactive — restore ShipStation secrets or disconnect.'
                : 'Connect ShipStation to sync carriers and push packed orders for labels.'}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {setupIncomplete ? (
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              label={`Setup ${setupProgress.present} of ${setupProgress.total}`}
              onClick={onOpenSetupCapabilities}
              sx={{ cursor: 'pointer' }}
            />
          ) : null}

          {!loading && !notPublished && organizationId ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<TuneOutlinedIcon />}
              onClick={onOpenSetupCapabilities}
            >
              Setup and capabilities
            </Button>
          ) : null}

          {loading ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Loading…
              </Typography>
            </Stack>
          ) : notPublished ? (
            <Chip size="small" color="error" label="Not published" />
          ) : !organizationId ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Open inside Digit
            </Typography>
          ) : !isAdmin ? (
            <Chip
              label={operable ? connectedLabel(apiVersion) : 'Not connected'}
              color={operable ? 'success' : 'default'}
              size="small"
              sx={motionTransition('background-color, box-shadow', '0.3s')}
            />
          ) : credentialsMissing ? (
            <>
              <Chip size="small" color="warning" label="Not connected" />
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<LinkOffIcon />}
                onClick={onOpenDisconnect}
              >
                Clear connection
              </Button>
            </>
          ) : operable ? (
            <>
              <Chip
                label={connectedLabel(apiVersion)}
                color="success"
                size="small"
                sx={motionTransition('background-color, box-shadow', '0.3s')}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {carrierCount} carrier{carrierCount === 1 ? '' : 's'}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<SettingsOutlinedIcon />}
                onClick={onOpenSettings}
              >
                Settings
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<LinkOffIcon />}
                onClick={onOpenDisconnect}
              >
                Disconnect
              </Button>
            </>
          ) : shipStationKeyPresent ? (
            <Button variant="contained" size="small" onClick={onConnect} disabled={mutating}>
              {mutating ? 'Connecting…' : 'Connect ShipStation'}
            </Button>
          ) : (
            <Chip size="small" color="warning" label="API key missing" />
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

export function ConnectPanel({
  shipStationKeyPresent,
  mutating,
  onConnect,
}: {
  shipStationKeyPresent: boolean;
  mutating: boolean;
  onConnect: () => void;
}) {
  if (!shipStationKeyPresent) {
    return (
      <Alert severity="warning">
        No ShipStation API key is configured for this organization. Add{' '}
        <strong>SHIPSTATION_API_KEY</strong> to this app’s secrets in Digit (and{' '}
        <strong>SHIPSTATION_API_SECRET</strong> only if you use V1 Basic auth), then reload and
        connect.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Connecting validates your credentials against ShipStation — API key alone is V2; key plus
        SHIPSTATION_API_SECRET is V1 — then syncs carriers and registers webhooks. If a previous
        connection is still on file, Connect replaces it. Switching API versions the same way.
        V1 with a public webhook URL also needs SHIPSTATION_WEBHOOK_TOKEN.
      </Typography>
      <Button variant="contained" onClick={onConnect} disabled={mutating} sx={{ alignSelf: 'flex-start' }}>
        {mutating ? 'Connecting…' : 'Connect ShipStation'}
      </Button>
    </Stack>
  );
}

export function NonAdminNotice({ connected }: { connected: boolean }) {
  return (
    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
      {connected
        ? 'Org admins manage connection and settings. You can work the fulfillment queue below.'
        : 'Org admins can connect ShipStation. App owners manage secrets in Digit.'}
    </Typography>
  );
}
