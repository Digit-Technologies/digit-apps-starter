import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';

import { motionFadeIn } from './motion';
import QueueStatusDisplay, { statusTooltipSlotProps } from './QueueStatusDisplay';
import StatusChip from './StatusChip';
import {
  digitShippingStatusChip,
  ineligibilityReason,
  queuePushDisplay,
  skipNextStep,
  trackingStatusChip,
  type CarrierMapsForEligibility,
  type OrgSettingsForEligibility,
  type ShipmentForEligibility,
} from '../eligibility';
import type { OrgSettingsData } from '../carrierTypes';
import {
  packageContainerLabel,
  packageCountLabel,
  type PackageContainer,
} from '../packageContainers';

type ShipmentNode = Omit<ShipmentForEligibility, 'packContainers'> & {
  id: string;
  documentNumber?: string | null;
  shippingNumber?: string | null;
  packContainers?: PackageContainer[] | null;
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
  ssLabelId?: string | null;
  hasLabel?: boolean | null;
  pushStatus?: string | null;
  lastError?: string | null;
  trackingNumber?: string | null;
  trackingStatus?: string | null;
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
  apiVersion = null,
  canPush,
  selected,
  onSelect,
  onCopySsId,
  copyHint,
  onDownloadLabel,
  labelDownloading = false,
  onDownloadSlip,
}: {
  shipment: ShipmentNode;
  map?: MapRow;
  orgSettings?: (OrgSettingsForEligibility & CarrierMapsForEligibility) | OrgSettingsData | null;
  apiVersion?: string | null;
  canPush: boolean;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onCopySsId: (id: string) => void;
  copyHint: string | null;
  onDownloadLabel: () => void;
  labelDownloading?: boolean;
  onDownloadSlip: () => void;
}) {
  const label = ticketLabel(shipment);
  const blocked = ineligibilityReason({
    shipment,
    orgSettings,
    mapRow: map ?? null,
    apiVersion,
    carrierMaps: orgSettings,
  });
  const pushDisplay = queuePushDisplay({
    blocked,
    mapRow: map,
    shippingStatus: shipment.shippingStatus,
  });
  const digitChip = digitShippingStatusChip(shipment.shippingStatus);
  const trackingChip = trackingStatusChip(map);
  const hasLabel = Boolean(map?.hasLabel || map?.ssLabelId);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        ...motionFadeIn,
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>
            {canPush ? (
              blocked ? (
                <Tooltip
                  title={`${blocked} ${skipNextStep(blocked)}`}
                  enterDelay={200}
                  enterTouchDelay={0}
                  slotProps={statusTooltipSlotProps}
                >
                  <span>
                    <Checkbox
                      checked={selected}
                      disabled
                      inputProps={{ 'aria-label': `Select shipment ${label}. ${blocked}` }}
                      sx={{ mt: -0.5, ml: -0.5 }}
                    />
                  </span>
                </Tooltip>
              ) : (
                <Checkbox
                  checked={selected}
                  onChange={(event) => onSelect(event.target.checked)}
                  inputProps={{ 'aria-label': `Select shipment ${label}` }}
                  sx={{ mt: -0.5, ml: -0.5 }}
                />
              )
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
          <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
            <Tooltip title={hasLabel ? 'Download shipping label' : 'No shipping label yet. Buy it in ShipStation, then pull from ShipStation.'}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Download shipping label"
                  disabled={!hasLabel || labelDownloading}
                  onClick={onDownloadLabel}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Download packing slip">
              <span>
                <IconButton
                  size="small"
                  aria-label="Download packing slip"
                  disabled={!shipment.order?.id}
                  onClick={onDownloadSlip}
                >
                  <DescriptionIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        <Stack
          spacing={0.25}
          sx={{ px: 1.25, py: 1, borderRadius: 1, bgcolor: 'action.hover' }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {packageCountLabel(shipment.packContainers)}
          </Typography>
          {(shipment.packContainers ?? []).map((container, index) => (
            <Typography
              key={container.id || index}
              variant="caption"
              sx={{ color: 'text.secondary' }}
            >
              {packageContainerLabel(container, index)}
            </Typography>
          ))}
        </Stack>

        <Stack spacing={0.5}>
          <Stack direction="row" spacing={0.5}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Carrier
            </Typography>
            <Typography
              variant="caption"
              sx={shipment.shippingCarrierField?.value ? undefined : { color: 'text.disabled' }}
            >
              {shipment.shippingCarrierField?.value ?? '—'}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Push status
            </Typography>
            <QueueStatusDisplay pushDisplay={pushDisplay} />
          </Stack>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Sutton status
            </Typography>
            {digitChip ? (
              <StatusChip color={digitChip.color} label={digitChip.label} />
            ) : (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                —
              </Typography>
            )}
          </Stack>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Tracking status
            </Typography>
            {trackingChip ? (
              <StatusChip color={trackingChip.color} label={trackingChip.label} />
            ) : (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                —
              </Typography>
            )}
          </Stack>
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
