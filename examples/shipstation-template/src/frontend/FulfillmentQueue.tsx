import { useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';

import {
  AppErrorAlert,
  useBackendMutation,
  useBackendQuery,
  useDigitApiMutation,
  useDigitApiQuery,
} from '@digit/lib-frontend';

import EmptyState from './components/EmptyState';
import OrderQueueCard from './components/OrderQueueCard';
import QueueStatusDisplay from './components/QueueStatusDisplay';
import SectionHeader from './components/SectionHeader';
import { motionFadeIn } from './components/motion';
import {
  digitShippingStatusLabel,
  ineligibilityReason,
  queuePushDisplay,
  shipStationLabelStatusLabel,
  type OrgSettingsForEligibility,
} from './eligibility';
import {
  packageContainerLabel,
  packageCountLabel,
  type PackageContainer,
} from './packageContainers';

const PAGE_SIZE = 10;

/** Active Digit shipping statuses shown in the queue (cancelled is omitted). */
const QUEUE_SHIPPING_STATUSES = [
  'awaiting_carrier',
  'awaiting_pickup',
  'awaiting_drop_off',
  'shipped',
] as const;

type QueueStatusFilter = 'all' | (typeof QUEUE_SHIPPING_STATUSES)[number];

const QUEUE_STATUS_FILTERS: { value: QueueStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'awaiting_carrier', label: 'Awaiting carrier' },
  { value: 'awaiting_pickup', label: 'Awaiting pickup' },
  { value: 'awaiting_drop_off', label: 'Awaiting drop-off' },
  { value: 'shipped', label: 'Shipped' },
];

function shippingStatusesForFilter(filter: QueueStatusFilter) {
  return filter === 'all' ? [...QUEUE_SHIPPING_STATUSES] : [filter];
}

function emptyQueueCopy(filter: QueueStatusFilter) {
  switch (filter) {
    case 'awaiting_carrier':
      return {
        title: 'No shipments awaiting carrier',
        description: 'Create a shipment in Digit. Awaiting carrier rows show up here.',
      };
    case 'awaiting_pickup':
      return {
        title: 'No shipments awaiting pickup',
        description: 'Digit shipments waiting for carrier pickup show up here.',
      };
    case 'awaiting_drop_off':
      return {
        title: 'No shipments awaiting drop-off',
        description: 'Digit shipments waiting to be dropped off show up here.',
      };
    case 'shipped':
      return {
        title: 'No shipped shipments',
        description: 'Shipped Digit shipments show up here after tracking is written back.',
      };
    default:
      return {
        title: 'No shipments',
        description: 'Create a shipment in Digit. Filter by Digit shipping status.',
      };
  }
}

const QUEUE_QUERY = `
  query ShipStationQueue($connection: ConnectionInput, $shippingStatuses: [ShippingStatus!]) {
    shipments(
      shippingStatuses: $shippingStatuses
      connection: $connection
      order: { by: createdAt, direction: desc }
    ) {
      pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
      nodes {
        id
        documentNumber
        shippingNumber
        shippingStatus
        trackingNumber
        packContainers {
          id
          container
          packageLength { value uom { name symbol type } }
          packageWidth { value uom { name symbol type } }
          packageHeight { value uom { name symbol type } }
          packageGrossWeight { value uom { name symbol type } }
          packedItems {
            quantity
            pickedItem {
              orderItem {
                id
                customerSku
                item { id name sku }
              }
            }
          }
        }
        order {
          id
          documentNumber
          orderNumber
          customer { name }
        }
      }
    }
  }
`;

type ShipmentNode = {
  id: string;
  documentNumber?: string | null;
  shippingNumber?: string | null;
  shippingStatus?: string | null;
  trackingNumber?: string | null;
  packContainers?: PackageContainer[] | null;
  order?: {
    id: string;
    documentNumber?: string | null;
    orderNumber?: string | null;
    customer?: { name?: string | null } | null;
  } | null;
};

type QueueData = {
  shipments?: {
    pageInfo?: {
      hasNextPage?: boolean;
      hasPreviousPage?: boolean;
      startCursor?: string | null;
      endCursor?: string | null;
    };
    nodes?: ShipmentNode[];
  };
};

type MapRow = {
  digitOrderId: string;
  digitShipmentId?: string | null;
  ssShipmentId?: string | null;
  ssLabelId?: string | null;
  hasLabel?: boolean | null;
  source?: string | null;
  pushStatus?: string | null;
  lastError?: string | null;
  trackingNumber?: string | null;
  trackingStatus?: string | null;
};

type MapsData = { maps: MapRow[] };

type LabelData = {
  filename: string;
  contentType: string;
  pdfBase64: string;
};

type PushResult = {
  shipmentId: string;
  ok: boolean;
  skipped: boolean;
  ssShipmentId?: string | null;
  ssLabelId?: string | null;
  message?: string | null;
  meaning?: string | null;
};

type PushData = {
  results: PushResult[];
  summary: { pushed: number; skipped: number; failed: number };
};

type PollIssue = {
  status: 'error' | 'skipped';
  ssShipmentId?: string;
  message: string;
};

/**
 * Digit shipment update the Worker cannot perform itself: API tokens are not granted
 * UPDATE_SHIPMENT, so Refresh applies these with the operator's session.
 */
type PendingWriteback = {
  digitShipmentId: string;
  digitOrderId: string;
  ssShipmentId: string;
  labelId: string | null;
  trackingNumber: string | null;
  carrierName: string | null;
  shipDate: string | null;
  shippingCarrierFieldId: string | null;
  shippingStatus?: string | null;
  notes: string | null;
};

type PollData = {
  pushed?: number;
  imported?: number;
  labelsPulled?: number;
  labelCandidates?: number;
  labelIssues?: PollIssue[];
  pendingWritebacks?: PendingWriteback[];
};

const UPDATE_SHIPMENT_MUTATION = `
  mutation ShipStationQueueUpdateShipment($input: UpdateShipmentInput!) {
    updateShipment(input: $input) {
      shipment { id trackingNumber shippingStatus }
    }
  }
`;

function ticketLabel(shipment: ShipmentNode) {
  return shipment.documentNumber || shipment.shippingNumber || shipment.id.slice(0, 8);
}

function mapHasLabel(map?: MapRow | null) {
  return Boolean(map?.hasLabel || map?.ssLabelId);
}

function pdfBufferFromBase64(pdfBase64: string) {
  const binary = atob(pdfBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
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
  variant = 'body1Link',
}: {
  path: string;
  label: string;
  variant?: 'body1Link' | 'subtitle2';
}) {
  const navigate = window.DigitHost?.navigate;
  if (!navigate) {
    return variant === 'subtitle2' ? (
      <Typography variant="subtitle2">{label}</Typography>
    ) : (
      <>{label}</>
    );
  }
  return (
    <Link
      component="button"
      type="button"
      underline="hover"
      onClick={() => navigate({ path })}
      sx={{
        typography: variant,
        color: 'inherit',
        verticalAlign: 'inherit',
        textAlign: 'left',
      }}
    >
      {label}
    </Link>
  );
}

const monoSx = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '0.8125rem',
} as const;

const selectionHeadCellSx = {
  position: 'sticky',
  left: 0,
  zIndex: 3,
  bgcolor: 'background.paper',
  borderRight: 1,
  borderColor: 'divider',
} as const;

const selectionBodyCellSx = {
  ...selectionHeadCellSx,
  zIndex: 1,
  '.MuiTableRow-hover:hover &': {
    bgcolor: 'action.hover',
  },
} as const;

export default function FulfillmentQueue({
  organizationId,
  canPush,
  apiVersion = null,
  pushDisabledReason = null,
  orgSettings = null,
  onPushComplete,
}: {
  organizationId: string;
  canPush: boolean;
  apiVersion?: string | null;
  pushDisabledReason?: string | null;
  orgSettings?: OrgSettingsForEligibility | null;
  onPushComplete?: () => void | Promise<void>;
}) {
  const [after, setAfter] = useState<string | null>(null);
  const [before, setBefore] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<QueueStatusFilter>('all');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [labelLocalError, setLabelLocalError] = useState<string | null>(null);
  const [pushNotice, setPushNotice] = useState<{
    severity: 'success' | 'warning' | 'error' | 'info';
    title: string;
    details: string[];
  } | null>(null);

  const queue = useDigitApiQuery<QueueData>({
    query: QUEUE_QUERY,
    variables: {
      shippingStatuses: shippingStatusesForFilter(statusFilter),
      connection: after
        ? { first: PAGE_SIZE, after }
        : before
          ? { last: PAGE_SIZE, before }
          : { first: PAGE_SIZE },
    },
  });

  const nodes = queue.data?.shipments?.nodes ?? [];
  const hasV1MultiContainer = apiVersion === 'v1' &&
    nodes.some((shipment) => (shipment.packContainers?.length ?? 0) > 1);
  const shipmentIds = nodes.map((node) => node.id).join(',');
  const mapsQuery = useBackendQuery<MapsData>({
    path: `/sync/shipments?organizationId=${encodeURIComponent(organizationId)}&shipmentIds=${encodeURIComponent(shipmentIds)}`,
    skip: !organizationId || nodes.length === 0,
  });

  const mapsById = useMemo(() => {
    const map = new Map<string, MapRow>();
    for (const row of mapsQuery.data?.maps ?? []) {
      if (row.digitShipmentId) map.set(row.digitShipmentId, row);
    }
    return map;
  }, [mapsQuery.data]);

  const [mutate, { error: pushError, loading: pushing, reset }] = useBackendMutation<PushData>();
  const [downloadLabelMutate, { error: labelError, loading: labelDownloading, reset: resetLabel }] =
    useBackendMutation<LabelData>();
  const [downloadSlipMutate, { error: slipError, loading: slipDownloading, reset: resetSlip }] =
    useBackendMutation<LabelData>();
  const [pollMutate, { error: pollError, loading: polling, reset: resetPoll }] =
    useBackendMutation<PollData>();
  const [updateShipmentMutate] = useDigitApiMutation({ mutation: UPDATE_SHIPMENT_MUTATION });
  const [writebackDoneMutate] = useBackendMutation();

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const pushSelected = async () => {
    const shipmentIdsToPush = Object.entries(selected)
      .filter(([, on]) => on)
      .map(([id]) => id);
    if (shipmentIdsToPush.length === 0) return;
    reset();
    setPushNotice(null);
    const result = await mutate({
      path: '/sync/push',
      method: 'POST',
      body: { organizationId, shipmentIds: shipmentIdsToPush },
    });
    if (!result.ok) return;
    const summary = result.data?.summary ?? { pushed: 0, skipped: 0, failed: 0 };
    const rows = result.data?.results ?? [];
    const details = rows
      .map((row) => row.meaning || row.message)
      .filter((text): text is string => Boolean(text));
    const severity =
      summary.failed > 0 ? 'error' : summary.skipped > 0 && summary.pushed === 0 ? 'warning' : 'success';
    setPushNotice({
      severity,
      title: `Push finished: ${summary.pushed} created in ShipStation, ${summary.skipped} skipped, ${summary.failed} failed.`,
      details,
    });
    setSelected((current) => {
      const next = { ...current };
      for (const row of rows) {
        if (row.ok && !row.skipped) next[row.shipmentId] = false;
      }
      return next;
    });
    await Promise.all([queue.refetch(), mapsQuery.refetch(), onPushComplete?.()]);
  };

  const refreshFromShipStation = async () => {
    resetPoll();
    setPushNotice(null);
    const result = await pollMutate({
      path: '/sync/poll',
      method: 'POST',
      body: { organizationId },
    });
    if (!result.ok) return;
    const autoPushed = Number(result.data?.pushed || 0);
    const candidates = Number(result.data?.labelCandidates || 0);
    const issues = [...(result.data?.labelIssues ?? [])];

    // The Worker staged the labels; writing them onto the Digit shipment needs this session's
    // permissions, so apply each one here and tell the Worker which ones landed.
    let pulled = 0;
    for (const pendingWriteback of result.data?.pendingWritebacks ?? []) {
      const updated = await updateShipmentMutate({
        variables: {
          input: {
            shipmentId: pendingWriteback.digitShipmentId,
            shippingStatus: pendingWriteback.shippingStatus || 'shipped',
            ...(pendingWriteback.trackingNumber
              ? { trackingNumber: pendingWriteback.trackingNumber }
              : {}),
            ...(pendingWriteback.notes ? { notes: pendingWriteback.notes } : {}),
            ...(pendingWriteback.shipDate ? { dropOffDate: pendingWriteback.shipDate } : {}),
            ...(pendingWriteback.shippingCarrierFieldId
              ? { shippingCarrierFieldId: pendingWriteback.shippingCarrierFieldId }
              : {}),
          },
        },
      });
      if (!updated.ok) {
        issues.push({
          status: 'error',
          ssShipmentId: pendingWriteback.ssShipmentId,
          message: `Could not write label ${pendingWriteback.labelId} to the Digit shipment: ${updated.error.message}`,
        });
        continue;
      }
      pulled += 1;
      await writebackDoneMutate({
        path: '/sync/writeback-complete',
        method: 'POST',
        body: { organizationId, digitShipmentId: pendingWriteback.digitShipmentId },
      });
    }

    const failed = issues.filter((issue) => issue.status === 'error');
    setPushNotice({
      severity: failed.length > 0 ? 'error' : pulled > 0 ? 'success' : 'info',
      title:
        failed.length > 0
          ? `Refresh could not finish ${failed.length} label(s).`
          : pulled > 0
            ? `Refresh wrote ${pulled} ShipStation label(s) into Digit.`
            : `Refresh checked ${candidates} pushed shipment(s) and found no new ShipStation labels.`,
      details: [
        ...issues.map((issue) => issue.message),
        issues.length > 0
          ? ''
          : pulled > 0
            ? 'Carrier, tracking, and cost are written to Digit when the label exists.'
            : candidates === 0
              ? 'No pushed shipments are waiting on a label. Push from the queue first.'
              : 'Buy the label in ShipStation, then Refresh again or wait up to five minutes.',
        autoPushed > 0 ? `${autoPushed} eligible shipment(s) were also pushed.` : '',
      ].filter(Boolean),
    });
    await Promise.all([queue.refetch(), mapsQuery.refetch(), onPushComplete?.()]);
  };

  const downloadShippingLabel = async (shipmentId: string) => {
    resetLabel();
    setLabelLocalError(null);
    const result = await downloadLabelMutate({
      path: '/sync/label',
      method: 'POST',
      body: { organizationId, shipmentId },
    });
    if (!result.ok) return;
    const pdfBase64 = result.data?.pdfBase64;
    if (!pdfBase64) {
      setLabelLocalError('ShipStation did not return label PDF data.');
      return;
    }
    try {
      window.DigitHost?.download({
        filename: result.data?.filename || `shipping-label-${shipmentId}.pdf`,
        contentType: 'application/pdf',
        data: pdfBufferFromBase64(pdfBase64),
      });
      setLabelLocalError(null);
      await onPushComplete?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Label download failed.';
      setLabelLocalError(message);
    }
  };

  const downloadPackingSlip = async (orderId: string) => {
    resetSlip();
    setPdfError(null);
    const result = await downloadSlipMutate({
      path: '/sync/packing-slip',
      method: 'POST',
      body: { organizationId, orderId },
    });
    if (!result.ok) return;
    const pdfBase64 = result.data?.pdfBase64;
    if (!pdfBase64) {
      setPdfError('Digit did not return packing slip PDF data.');
      return;
    }
    try {
      const buffer = pdfBufferFromBase64(pdfBase64);
      window.DigitHost?.download({
        filename: result.data?.filename || `packing-slip-${orderId}.pdf`,
        contentType: 'application/pdf',
        data: buffer,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Packing slip download failed.';
      setPdfError(message);
    }
  };

  const pageInfo = queue.data?.shipments?.pageInfo;
  const emptyCopy = emptyQueueCopy(statusFilter);
  const showSelection = canPush && statusFilter !== 'shipped';

  const setStatusFilterAndResetPage = (next: QueueStatusFilter) => {
    setStatusFilter(next);
    setAfter(null);
    setBefore(null);
  };

  const pushBar = showSelection ? (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      sx={{
        position: { xs: 'fixed', md: 'sticky' },
        bottom: { xs: 0, md: 'auto' },
        top: { md: 0 },
        left: { xs: 0, md: 'auto' },
        right: { xs: 0, md: 'auto' },
        zIndex: 5,
        mx: { xs: -2, md: 0 },
        px: { xs: 2, md: 0 },
        py: { xs: 1.5, md: 1 },
        mb: { md: 1 },
        bgcolor: 'background.paper',
        borderTop: { xs: 1, md: 0 },
        borderBottom: { md: 1 },
        borderColor: 'divider',
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: selectedCount === 0 && pushDisabledReason ? 'warning.main' : 'text.secondary',
        }}
      >
        {selectedCount > 0
          ? `${selectedCount} shipment${selectedCount === 1 ? '' : 's'} selected`
          : pushDisabledReason ?? 'Select shipments to push'}
      </Typography>
      <Button
        variant="contained"
        onClick={() => void pushSelected()}
        disabled={pushing || polling || Boolean(pushDisabledReason) || selectedCount === 0}
      >
        {pushing ? 'Pushing…' : 'Push selected'}
      </Button>
    </Stack>
  ) : null;

  return (
    <Stack spacing={2}>
      <SectionHeader
        overline="Queue"
        title="Shipping queue"
        description="Digit shipment status and ShipStation tracking status for each row. Push, buy the label in ShipStation, then Refresh (or wait five minutes)."
        action={
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="queue-status-filter-label">Digit status</InputLabel>
              <Select
                labelId="queue-status-filter-label"
                label="Digit status"
                value={statusFilter}
                onChange={(event) => setStatusFilterAndResetPage(event.target.value as QueueStatusFilter)}
              >
                {QUEUE_STATUS_FILTERS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={() => void refreshFromShipStation()}
              disabled={polling || pushing || !organizationId}
            >
              {polling ? 'Refreshing…' : 'Refresh'}
            </Button>
          </Stack>
        }
      />

      {hasV1MultiContainer ? (
        <Alert severity="warning">
          ShipStation V1 cannot push shipments with multiple packages. Create one Digit shipment
          per pack container, or disconnect ShipStation and reconnect with V2 credentials.
          Affected rows are marked Blocked.
        </Alert>
      ) : null}

      {pushNotice ? (
        <Alert severity={pushNotice.severity} onClose={() => setPushNotice(null)}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {pushNotice.title}
          </Typography>
          <Stack component="ul" sx={{ m: 0, pl: 2, mt: 0.5 }}>
            {pushNotice.details.map((line, index) => (
              <Typography key={`${index}-${line.slice(0, 40)}`} component="li" variant="body2">
                {line}
              </Typography>
            ))}
          </Stack>
        </Alert>
      ) : null}

      {queue.error && <AppErrorAlert error={queue.error} onRetry={() => void queue.refetch()} />}
      {mapsQuery.error && (
        <AppErrorAlert error={mapsQuery.error} onRetry={() => void mapsQuery.refetch()} />
      )}
      {pushError && <AppErrorAlert error={pushError} />}
      {pollError && <AppErrorAlert error={pollError} />}
      {slipError && <AppErrorAlert error={slipError} />}
      {labelError && <AppErrorAlert error={labelError} />}
      {pdfError ? (
        <Alert severity="error" onClose={() => setPdfError(null)}>
          {pdfError}
        </Alert>
      ) : null}
      {labelLocalError ? (
        <Alert severity="error" onClose={() => setLabelLocalError(null)}>
          {labelLocalError}
        </Alert>
      ) : null}

      {selectedCount > 0 || showSelection ? pushBar : null}

      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%' }}>
          <Table size="small" sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow>
                {showSelection ? <TableCell padding="checkbox" sx={selectionHeadCellSx} /> : null}
                <TableCell>Shipment</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Packages</TableCell>
                <TableCell>Push status</TableCell>
                <TableCell>Digit status</TableCell>
                <TableCell>Tracking status</TableCell>
                <TableCell>ShipStation ID</TableCell>
                <TableCell>Tracking</TableCell>
                <TableCell align="right">Files</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nodes.map((shipment) => {
                const map = mapsById.get(shipment.id);
                const label = ticketLabel(shipment);
                const blocked = ineligibilityReason({
                  shipment,
                  orgSettings,
                  mapRow: map ?? null,
                  apiVersion,
                });
                const pushDisplay = queuePushDisplay({
                  blocked,
                  mapRow: map,
                  shippingStatus: shipment.shippingStatus,
                });
                const selectable = !blocked;
                return (
                  <TableRow key={shipment.id} hover sx={motionFadeIn}>
                    {showSelection ? (
                      <TableCell padding="checkbox" sx={selectionBodyCellSx}>
                        <Checkbox
                          checked={Boolean(selected[shipment.id])}
                          disabled={!selectable}
                          onChange={(event) =>
                            setSelected((current) => ({
                              ...current,
                              [shipment.id]: event.target.checked,
                            }))
                          }
                        />
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <Stack spacing={0.25}>
                        <DigitLink path={shipmentPath(shipment.id)} label={label} />
                        {shipment.order?.id ? (
                          <DigitLink
                            path={salesOrderPath(shipment.order.id)}
                            label={shipment.order.documentNumber || shipment.order.orderNumber || 'Sales order'}
                            variant="subtitle2"
                          />
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell>{shipment.order?.customer?.name ?? '—'}</TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">
                          {packageCountLabel(shipment.packContainers)}
                        </Typography>
                        {(shipment.packContainers ?? []).map((container, index) => (
                          <Typography
                            key={container.id || index}
                            variant="caption"
                            sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}
                          >
                            {packageContainerLabel(container, index)}
                          </Typography>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <QueueStatusDisplay pushDisplay={pushDisplay} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {digitShippingStatusLabel(shipment.shippingStatus)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={
                          shipStationLabelStatusLabel(map) === '—'
                            ? { color: 'text.disabled' }
                            : undefined
                        }
                      >
                        {shipStationLabelStatusLabel(map)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="body2" sx={map?.ssShipmentId ? monoSx : undefined}>
                          {map?.ssShipmentId ?? '—'}
                        </Typography>
                        {map?.ssShipmentId ? (
                          <Tooltip title={copyHint === map.ssShipmentId ? 'Copied' : 'Copy id'}>
                            <IconButton
                              size="small"
                              aria-label="Copy ShipStation shipment id"
                              onClick={() => {
                                void navigator.clipboard.writeText(map.ssShipmentId ?? '');
                                setCopyHint(map.ssShipmentId ?? null);
                              }}
                            >
                              <ContentCopyIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={map?.trackingNumber ? monoSx : undefined}>
                        {map?.trackingNumber ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                        <Tooltip
                          title={
                            mapHasLabel(map)
                              ? 'Download shipping label'
                              : 'No shipping label yet. Buy it in ShipStation, then Refresh.'
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              aria-label="Download shipping label"
                              disabled={!mapHasLabel(map) || labelDownloading}
                              onClick={() => void downloadShippingLabel(shipment.id)}
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
                              disabled={!shipment.order?.id || slipDownloading}
                              onClick={() => {
                                if (!shipment.order?.id) return;
                                void downloadPackingSlip(shipment.order.id);
                              }}
                            >
                              <DescriptionIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              {nodes.length === 0 && !queue.loading ? (
                <TableRow>
                  <TableCell colSpan={showSelection ? 10 : 9}>
                    <EmptyState title={emptyCopy.title} description={emptyCopy.description} />
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' }, pb: selectedCount > 0 ? 8 : 0 }}>
        {nodes.map((shipment) => (
          <OrderQueueCard
            key={shipment.id}
            shipment={shipment}
            map={mapsById.get(shipment.id)}
            orgSettings={orgSettings}
            apiVersion={apiVersion}
            canPush={showSelection}
            selected={Boolean(selected[shipment.id])}
            onSelect={(checked) =>
              setSelected((current) => ({ ...current, [shipment.id]: checked }))
            }
            onCopySsId={(id) => {
              void navigator.clipboard.writeText(id);
              setCopyHint(id);
            }}
            copyHint={copyHint}
            onDownloadLabel={() => void downloadShippingLabel(shipment.id)}
            labelDownloading={labelDownloading}
            onDownloadSlip={() => {
              if (!shipment.order?.id) return;
              void downloadPackingSlip(shipment.order.id);
            }}
          />
        ))}
        {nodes.length === 0 && !queue.loading ? (
          <EmptyState title={emptyCopy.title} description={emptyCopy.description} />
        ) : null}
      </Stack>

      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button
          disabled={!pageInfo?.hasPreviousPage}
          onClick={() => {
            setAfter(null);
            setBefore(pageInfo?.startCursor ?? null);
          }}
        >
          Previous
        </Button>
        <Button
          disabled={!pageInfo?.hasNextPage}
          onClick={() => {
            setBefore(null);
            setAfter(pageInfo?.endCursor ?? null);
          }}
        >
          Next
        </Button>
      </Stack>
    </Stack>
  );
}
