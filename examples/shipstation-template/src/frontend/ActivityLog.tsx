import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { AppErrorAlert, useBackendQuery } from '@digit/lib-frontend';

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
  if (status === 'error') return 'error';
  return 'default';
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

export default function ActivityLog({
  query,
}: {
  query: ReturnType<typeof useBackendQuery<ActivityData>>;
}) {
  const events = query.data?.events ?? [];

  return (
    <Stack spacing={1}>
      <Typography variant="h3" component="h3">
        Activity
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Recent pushes, settings changes, webhooks, and scheduled jobs for this organization. Use
        copy on a row when you need to send details to support.
      </Typography>
      {query.error && (
        <AppErrorAlert error={query.error} onRetry={() => void query.refetch()} />
      )}
      {events.length === 0 && !query.loading ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          No activity yet. Push an order or connect ShipStation to start the log.
        </Typography>
      ) : null}
      <Stack spacing={1} sx={{ maxHeight: 320, overflow: 'auto' }}>
        {events.map((event) => (
          <Box
            key={event.id}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 1.25,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
              <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                  <Chip size="small" color={statusColor(event.status)} label={event.status} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {formatWhen(event.createdAt)} · {event.actor} · {event.action.replace(/_/g, ' ')}
                  </Typography>
                </Stack>
                <Typography variant="body2">{event.message}</Typography>
                {event.digitOrderId || event.ssShipmentId || event.channelId || event.externalOrderId ? (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
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
          </Box>
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
