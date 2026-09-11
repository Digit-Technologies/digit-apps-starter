import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';

import { motionFadeIn } from './motion';
import QueueStatusDisplay from './QueueStatusDisplay';
import {
  ineligibilityReason,
  queuePushDisplay,
  type OrgSettingsForEligibility,
  type ShipmentForEligibility,
} from '../eligibility';

type ShipmentNode = ShipmentForEligibility & {
  id: string;
  documentNumber?: string | null;
  shippingNumber?: string | null;
  order?: {
    id?: string | null;
    documentNumber?: string | null;
    orderNumber?: string | null;
    customer?: { name?: string | null } | null;
  } | null;
};

type MapRow = {
  digitOrderId: string;
  ssShipmentId?: string | null;
  pushStatus?: string | null;
  lastError?: string | null;
  trackingNumber?: string | null;
  source?: string | null;
};

function ticketLabel(shipment: ShipmentNode) {
  return shipment.documentNumber || shipment.shippingNumber || shipment.id.slice(0, 8);
}

function shipmentPath(shipmentId: string) {
  return `/fulfillment/shipments/${shipmentId}`;
}

function salesOrderPath(orderId: string) {
  return `/sales/orders/${orderId}`;
}

function DigitLink({
  path,
  label,
}: {
  path: string;
  label: string;
}) {
  const navigate = window.DigitHost?.navigate;
  if (!navigate) return <Typography variant="subtitle2">{label}</Typography>;
  return (
    <Link
      component="button"
      type="button"
      underline="hover"
      onClick={() => navigate({ path })}
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
  shipment,
  map,
  orgSettings,
  canPush,
  selected,
  onSelect,
  onCopySsId,
  copyHint,
  onDownloadSlip,
}: {
  shipment: ShipmentNode;
  map?: MapRow;
  orgSettings?: OrgSettingsForEligibility | null;
  canPush: boolean;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onCopySsId: (id: string) => void;
  copyHint: string | null;
  onDownloadSlip: () => void;
}) {
  const label = ticketLabel(shipment);
  const blocked = ineligibilityReason({ shipment, orgSettings, mapRow: map ?? null });
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
                inputProps={{ 'aria-label': `Select shipment ${label}` }}
                sx={{ mt: -0.5, ml: -0.5 }}
              />
            ) : null}
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              <DigitLink path={shipmentPath(shipment.id)} label={label} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {shipment.order?.customer?.name ?? 'No customer'}
              </Typography>
              {shipment.order?.id ? (
                <DigitLink
                  path={salesOrderPath(shipment.order.id)}
                  label={shipment.order.documentNumber || shipment.order.orderNumber || 'Sales order'}
                />
              ) : null}
            </Stack>
          </Stack>
          <IconButton
            size="small"
            aria-label="Download packing slip"
            disabled={!shipment.order?.id}
            onClick={onDownloadSlip}
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Stack>

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
