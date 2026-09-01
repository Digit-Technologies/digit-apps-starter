import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { AppErrorAlert, useBackendQuery } from '@digit/lib-frontend';

import SectionHeader from './components/SectionHeader';

export type ActivityEvent = {
  id: number;
  createdAt: string;
  actor: string;
  action: string;
  status: string;
  message: string;
  digitOrderId?: string | null;
  ssShipmentId?: string | null;
  channelId?: string | null;
  externalOrderId?: string | null;
  detail?: unknown;
};

type ActivityData = { events: ActivityEvent[] };

function statusColor(status: string): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'success') return 'success';
  if (status === 'skipped') return 'warning';
  if (status === 'error' || status === 'failed') return 'error';
  return 'default';
}

function timelineDotColor(status: string) {
  const color = statusColor(status);
  if (color === 'default') return 'action.disabled';
  return `${color}.main`;
}

function formatWhen(createdAt: string) {
  const iso = createdAt.includes('T') ? createdAt : createdAt.replace(' ', 'T');
  const date = new Date(iso.endsWith('Z') ? iso : `${iso}Z`);
  if (Number.isNaN(date.getTime())) return createdAt;
  return date.toLocaleString();
}

function copyText(event: ActivityEvent) {
  const lines = [
    `${formatWhen(event.createdAt)} ${event.actor} ${event.action} ${event.status}`,
    event.message,
    event.digitOrderId ? `Digit order: ${event.digitOrderId}` : null,
    event.ssShipmentId ? `ShipStation shipment: ${event.ssShipmentId}` : null,
    event.channelId ? `Channel: ${event.channelId}` : null,
    event.externalOrderId ? `External order: ${event.externalOrderId}` : null,
  ].filter(Boolean);
  return lines.join('\n');
}

const monoSx = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '0.7rem',
} as const;

export default function ActivityLog({
  query,
}: {
  query: ReturnType<typeof useBackendQuery<ActivityData>>;
}) {
  const events = query.data?.events ?? [];

  return (
    <Stack spacing={2}>
      <SectionHeader
        overline="Activity"
        title="Recent events"
        description="Pushes, settings changes, webhooks, and scheduled jobs. Copy a row to share with support."
      />
      {query.error && (
        <AppErrorAlert error={query.error} onRetry={() => void query.refetch()} />
      )}
      {events.length === 0 && !query.loading ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          No activity yet. Push an order or connect ShipStation to start the log.
        </Typography>
      ) : null}
      <Stack spacing={0} sx={{ maxHeight: 360, overflow: 'auto' }}>
        {events.map((event, index) => (
          <Stack
            key={event.id}
            direction="row"
            spacing={1.5}
            sx={{
              py: 1.25,
              borderTop: index > 0 ? 1 : 0,
              borderColor: 'divider',
              position: 'relative',
              pl: 2,
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 4,
                top: index === 0 ? 16 : 0,
                bottom: index === events.length - 1 ? 'auto' : 0,
                width: 2,
                bgcolor: 'divider',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                left: 1,
                top: 18,
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: timelineDotColor(event.status),
                border: 2,
                borderColor: 'background.paper',
              },
            }}
          >
            <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip size="small" color={statusColor(event.status)} label={event.status} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {formatWhen(event.createdAt)} · {event.actor} · {event.action.replace(/_/g, ' ')}
                </Typography>
              </Stack>
              <Typography variant="body2">{event.message}</Typography>
              {event.digitOrderId || event.ssShipmentId || event.channelId || event.externalOrderId ? (
                <Typography variant="caption" sx={{ color: 'text.secondary', ...monoSx }}>
                  {[
                    event.digitOrderId ? `Order ${event.digitOrderId}` : null,
                    event.ssShipmentId ? `SS ${event.ssShipmentId}` : null,
                    event.channelId ? `${event.channelId}` : null,
                    event.externalOrderId ? `Ext ${event.externalOrderId}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Typography>
              ) : null}
            </Stack>
            <Tooltip title="Copy this event">
              <IconButton
                size="small"
                aria-label="Copy activity event"
                onClick={() => void navigator.clipboard.writeText(copyText(event))}
              >
                <ContentCopyIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

export function useActivityQuery(organizationId: string) {
  return useBackendQuery<ActivityData>({
    path: `/sync/activity?organizationId=${encodeURIComponent(organizationId)}`,
    skip: !organizationId,
  });
}
