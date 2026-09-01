import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';

import FulfillmentLane from './FulfillmentLane';
import { motionFadeIn } from './motion';
import QueueStatusDisplay from './QueueStatusDisplay';
import {
  ineligibilityReason,
  queuePushDisplay,
  type OrgSettingsForEligibility,
} from '../eligibility';

type OrderNode = {
  id: string;
  documentNumber?: string | null;
  orderNumber?: string | null;
  packingStatus?: string | null;
  pickingStatus?: string | null;
  customer?: { name?: string | null } | null;
  tags?: { id: string; value: string }[] | null;
  items?: { quantity: number; itemAvailability?: string | null; totalShippedQuantity?: number }[] | null;
};

type MapRow = {
  digitOrderId: string;
  ssShipmentId?: string | null;
  pushStatus?: string | null;
  lastError?: string | null;
  trackingNumber?: string | null;
  source?: string | null;
};

function orderLabel(order: OrderNode) {
  return order.documentNumber || order.orderNumber || order.id.slice(0, 8);
}

function salesOrderPath(orderId: string) {
  return `/sales/orders/${orderId}`;
}

function OrderLink({ orderId, label }: { orderId: string; label: string }) {
  const navigate = window.DigitHost?.navigate;
  if (!navigate) return <Typography variant="subtitle2">{label}</Typography>;
  return (
    <Link
      component="button"
      type="button"
      underline="hover"
      onClick={() => navigate({ path: salesOrderPath(orderId) })}
      sx={{ typography: 'subtitle2', color: 'inherit', textAlign: 'left' }}
    >
      {label}
    </Link>
  );
}

const monoSx = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '0.75rem',
} as const;

export default function OrderQueueCard({
  order,
  map,
  orgSettings,
  canPush,
  selected,
  onSelect,
  onCopySsId,
  copyHint,
  onDownloadSlip,
}: {
  order: OrderNode;
  map?: MapRow;
  orgSettings?: OrgSettingsForEligibility | null;
  canPush: boolean;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onCopySsId: (id: string) => void;
  copyHint: string | null;
  onDownloadSlip: () => void;
}) {
  const label = orderLabel(order);
  const blocked = ineligibilityReason({ order, orgSettings, mapRow: map ?? null });
  const pushDisplay = queuePushDisplay({ blocked, mapRow: map ?? null });

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        ...motionFadeIn,
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>
            {canPush ? (
              <Checkbox
                checked={selected}
                onChange={(event) => onSelect(event.target.checked)}
                inputProps={{ 'aria-label': `Select order ${label}` }}
                sx={{ mt: -0.5, ml: -0.5 }}
              />
            ) : null}
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              <OrderLink orderId={order.id} label={label} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {order.customer?.name ?? 'No customer'}
              </Typography>
            </Stack>
          </Stack>
          <IconButton size="small" aria-label="Download packing slip" onClick={onDownloadSlip}>
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Stack>

        <FulfillmentLane order={order} mapRow={map ?? null} orgSettings={orgSettings} />

        <QueueStatusDisplay pushDisplay={pushDisplay} />

        <Stack spacing={0.5}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              ShipStation ID
            </Typography>
            {map?.ssShipmentId ? (
              <>
                <Typography variant="caption" sx={monoSx}>
                  {map.ssShipmentId}
                </Typography>
                <Tooltip title={copyHint === map.ssShipmentId ? 'Copied' : 'Copy id'}>
                  <IconButton
                    size="small"
                    aria-label="Copy ShipStation shipment id"
                    onClick={() => onCopySsId(map.ssShipmentId ?? '')}
                  >
                    <ContentCopyIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                —
              </Typography>
            )}
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Tracking
            </Typography>
            <Typography variant="caption" sx={map?.trackingNumber ? monoSx : { color: 'text.disabled' }}>
              {map?.trackingNumber ?? '—'}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
