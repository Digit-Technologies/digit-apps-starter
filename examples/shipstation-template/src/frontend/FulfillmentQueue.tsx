import { useEffect, useMemo, useRef, useState } from 'react';

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
import SyncIcon from '@mui/icons-material/Sync';

import {
  AppErrorAlert,
  useBackendMutation,
  useBackendQuery,
  useDigitApiMutation,
  useDigitApiQuery,
} from '@digit/lib-frontend';

import EmptyState from './components/EmptyState';
import OrderQueueCard from './components/OrderQueueCard';
import PackageTypeList, { missingSelectionReason } from './components/PackageTypeList';
import QueueStatusDisplay, { statusTooltipSlotProps } from './components/QueueStatusDisplay';
import SectionHeader from './components/SectionHeader';
import StatusChip from './components/StatusChip';
import { motionFadeIn } from './components/motion';
import {
  digitShippingStatusChip,
  effectiveShippingCarrierField,
  ineligibilityReason,
  queuePushDisplay,
  resolveSsServiceFromDigitOption,
  skipNextStep,
  trackingStatusChip,
  type CarrierMapsForEligibility,
  type OrgSettingsForEligibility,
} from './eligibility';
import type { OrgSettingsData } from './carrierTypes';
import type { PackageContainer } from './packageContainers';
import {
  isStaleCarrierSelection,
  packageSelectionLocked,
  type PackageCatalog,
  type PackageChoice,
  type PackageSelection,
} from './packageSelection';
import { useRefetchWhenVisible } from './useRefetchWhenVisible';

const PAGE_SIZE = 100;

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
        description: 'Create a shipment in Sutton. Awaiting carrier rows show up here.',
      };
    case 'awaiting_pickup':
      return {
        title: 'No shipments awaiting pickup',
        description: 'Sutton shipments waiting for carrier pickup show up here.',
      };
    case 'awaiting_drop_off':
      return {
        title: 'No shipments awaiting drop-off',
        description: 'Sutton shipments waiting to be dropped off show up here.',
      };
    case 'shipped':
      return {
        title: 'No shipped shipments',
        description: 'Shipped Sutton shipments show up here after tracking is written back.',
      };
    default:
      return {
        title: 'No shipments',
        description: 'Create a shipment in Sutton. Filter by Sutton shipping status.',
      };
  }
}

const SHIPMENT_ROW_FIELDS = `
        id
        documentNumber
        shippingNumber
        shippingStatus
        trackingNumber
        shippingCarrierField { id value }
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
          shippingCarrierField { id value }
        }
`;

const QUEUE_QUERY = `
  query ShipStationQueue($connection: ConnectionInput, $shippingStatuses: [ShippingStatus!]) {
    shipments(
      shippingStatuses: $shippingStatuses
      connection: $connection
      order: { by: createdAt, direction: desc }
    ) {
      pageInfo { hasNextPage }
      nodes { ${SHIPMENT_ROW_FIELDS} }
    }
  }
`;

function withEffectiveCarrier(shipment: ShipmentNode): ShipmentNode {
  const carrier = effectiveShippingCarrierField(shipment);
  if (carrier === shipment.shippingCarrierField) return shipment;
  return { ...shipment, shippingCarrierField: carrier };
}

type ShipmentNode = {
  id: string;
  documentNumber?: string | null;
  shippingNumber?: string | null;
  shippingStatus?: string | null;
  trackingNumber?: string | null;
  shippingCarrierField?: { id?: string | null; value?: string | null } | null;
  packContainers?: PackageContainer[] | null;
  order?: {
    id: string;
    documentNumber?: string | null;
    orderNumber?: string | null;
    customer?: { name?: string | null } | null;
    shippingCarrierField?: { id?: string | null; value?: string | null } | null;
  } | null;
};

type QueueData = {
  shipments?: {
    pageInfo?: {
      hasNextPage?: boolean;
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

const EMPTY_SHIPMENTS: ShipmentNode[] = [];

type MapsData = { maps: MapRow[]; packageSelections?: PackageSelection[] };

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
 * UPDATE_SHIPMENT, so Pull from ShipStation applies these with the operator's session.
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
  shippingFees?: { currencyCode: string; costAmount: number } | null;
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

const UPDATE_ORDER_MUTATION = `
  mutation ShipStationQueueUpdateOrder($input: UpdateOrderInput!) {
    updateOrder(input: $input) {
      order { id }
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
  verticalAlign: 'middle',
  textAlign: 'center',
  width: 56,
  minWidth: 56,
  maxWidth: 56,
  px: 0,
} as const;

const selectionBodyCellSx = {
  ...selectionHeadCellSx,
  zIndex: 1,
  '.MuiTableRow-hover:hover &': {
    bgcolor: 'action.hover',
  },
} as const;

const filesHeadCellSx = {
  position: 'sticky',
  right: 0,
  zIndex: 3,
  bgcolor: 'background.paper',
  verticalAlign: 'middle',
  textAlign: 'center',
  width: 88,
  minWidth: 88,
  px: 0.5,
} as const;

const filesBodyCellSx = {
  ...filesHeadCellSx,
  zIndex: 1,
  '.MuiTableRow-hover:hover &': {
    bgcolor: 'action.hover',
  },
} as const;

const tableCellSx = {
  verticalAlign: 'middle',
  py: 1,
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
  orgSettings?: (OrgSettingsForEligibility & CarrierMapsForEligibility) | OrgSettingsData | null;
  onPushComplete?: () => void | Promise<void>;
}) {
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
      connection: { first: PAGE_SIZE },
    },
  });

  const listedNodes = queue.data?.shipments?.nodes ?? EMPTY_SHIPMENTS;
  const nodes = useMemo(
    () => listedNodes.map((node) => withEffectiveCarrier(node)),
    [listedNodes],
  );
  const hasV1MultiContainer = apiVersion === 'v1' &&
    nodes.some((shipment) => (shipment.packContainers?.length ?? 0) > 1);
  const shipmentIds = nodes.map((node) => node.id).join(',');
  const mapsQuery = useBackendQuery<MapsData>({
    path: `/sync/shipments?organizationId=${encodeURIComponent(organizationId)}&shipmentIds=${encodeURIComponent(shipmentIds)}`,
    skip: !organizationId || nodes.length === 0,
  });

  const carrierQuery = useMemo(() => {
    const ids = new Set<string>();
    const codes = new Set<string>();
    for (const shipment of nodes) {
      const field = effectiveShippingCarrierField(shipment);
      const resolved = resolveSsServiceFromDigitOption({
        digitOptionId: field?.id,
        digitValue: field?.value,
        mappings: orgSettings?.carrierMappings ?? [],
        ssCarriers: orgSettings?.ssCarriers ?? [],
      });
      if (resolved.status !== 'ok') continue;
      if (resolved.carrierId) ids.add(resolved.carrierId);
      if (resolved.carrierCode) codes.add(resolved.carrierCode);
    }
    return { ids: [...ids].sort().join(','), codes: [...codes].sort().join(',') };
  }, [nodes, orgSettings]);

  const typesQuery = useBackendQuery<PackageCatalog>({
    path: `/package-types?organizationId=${encodeURIComponent(organizationId)}&carrierIds=${encodeURIComponent(carrierQuery.ids)}&carrierCodes=${encodeURIComponent(carrierQuery.codes)}`,
    skip: !organizationId,
  });

  useRefetchWhenVisible(async () => {
    await Promise.all([queue.refetch(), mapsQuery.refetch(), typesQuery.refetch()]);
    await onPushComplete?.();
  });

  const mapsById = useMemo(() => {
    const map = new Map<string, MapRow>();
    for (const row of mapsQuery.data?.maps ?? []) {
      if (row.digitShipmentId) map.set(row.digitShipmentId, row);
    }
    return map;
  }, [mapsQuery.data]);

  const selectionsByShipment = useMemo(() => {
    const map = new Map<string, PackageSelection[]>();
    for (const row of mapsQuery.data?.packageSelections ?? []) {
      const list = map.get(row.digitShipmentId) ?? [];
      list.push(row);
      map.set(row.digitShipmentId, list);
    }
    return map;
  }, [mapsQuery.data]);

  const [saveSelection] = useBackendMutation();
  const [savingContainerId, setSavingContainerId] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const clearingRef = useRef(new Set<string>());

  const savePackageChoice = async (
    shipmentId: string,
    containerId: string,
    choice: PackageChoice | null,
  ) => {
    setSavingContainerId(containerId);
    setSelectionError(null);
    const result = await saveSelection({
      path: '/package-selections',
      method: 'PUT',
      body: choice
        ? { organizationId, digitShipmentId: shipmentId, digitContainerId: containerId, ...choice }
        : { organizationId, digitShipmentId: shipmentId, digitContainerId: containerId, clear: true },
    });
    setSavingContainerId(null);
    if (!result.ok) {
      setSelectionError(result.error.message);
      return;
    }
    await mapsQuery.refetch();
  };

  useEffect(() => {
    if (!organizationId) return;
    for (const shipment of nodes) {
      if (packageSelectionLocked(mapsById.get(shipment.id))) continue;
      const field = effectiveShippingCarrierField(shipment);
      const resolved = resolveSsServiceFromDigitOption({
        digitOptionId: field?.id,
        digitValue: field?.value,
        mappings: orgSettings?.carrierMappings ?? [],
        ssCarriers: orgSettings?.ssCarriers ?? [],
      });
      for (const selection of selectionsByShipment.get(shipment.id) ?? []) {
        if (!isStaleCarrierSelection(selection, resolved)) continue;
        const key = `${shipment.id}:${selection.digitContainerId}`;
        if (clearingRef.current.has(key)) continue;
        clearingRef.current.add(key);
        void saveSelection({
          path: '/package-selections',
          method: 'PUT',
          body: {
            organizationId,
            digitShipmentId: shipment.id,
            digitContainerId: selection.digitContainerId,
            clear: true,
          },
        }).then((result) => {
          clearingRef.current.delete(key);
          if (result.ok) void mapsQuery.refetch();
        });
      }
    }
  }, [mapsById, nodes, orgSettings, organizationId, saveSelection, selectionsByShipment, mapsQuery.refetch]);

  const [mutate, { error: pushError, loading: pushing, reset }] = useBackendMutation<PushData>();
  const [downloadLabelMutate, { error: labelError, loading: labelDownloading, reset: resetLabel }] =
    useBackendMutation<LabelData>();
  const [downloadSlipMutate, { error: slipError, loading: slipDownloading, reset: resetSlip }] =
    useBackendMutation<LabelData>();
  const [pollMutate, { error: pollError, loading: polling, reset: resetPoll }] =
    useBackendMutation<PollData>();
  const [updateShipmentMutate] = useDigitApiMutation({ mutation: UPDATE_SHIPMENT_MUTATION });
  const [updateOrderMutate] = useDigitApiMutation({ mutation: UPDATE_ORDER_MUTATION });
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

  const pullFromShipStation = async () => {
    resetPoll();
    setPushNotice(null);
    const result = await pollMutate({
      path: '/sync/poll',
      method: 'POST',
      body: { organizationId },
    });
    if (!result.ok) return;
    const candidates = Number(result.data?.labelCandidates || 0);
    const issues = [...(result.data?.labelIssues ?? [])];

    // The Worker staged the labels; writing them onto the Digit shipment needs this session's
    // permissions, so apply each one here and tell the Worker which ones landed.
    let pulled = 0;
    for (const pendingWriteback of result.data?.pendingWritebacks ?? []) {
      const shipment = nodes.find((node) => node.id === pendingWriteback.digitShipmentId);
      const shipmentLabel = shipment ? ticketLabel(shipment) : null;
      const orderLabel = shipment?.order?.documentNumber || shipment?.order?.orderNumber || null;
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
          message: `Could not write label ${pendingWriteback.labelId} to the Sutton shipment: ${updated.error.message}`,
        });
        await writebackDoneMutate({
          path: '/sync/writeback-complete',
          method: 'POST',
          body: {
            organizationId,
            digitShipmentId: pendingWriteback.digitShipmentId,
            digitOrderId: pendingWriteback.digitOrderId,
            recordOnly: true,
            kind: 'shipment',
            label: shipmentLabel,
            message: updated.error.message,
          },
        });
        continue;
      }
      if (
        pendingWriteback.digitOrderId &&
        (pendingWriteback.shippingFees || pendingWriteback.shippingCarrierFieldId)
      ) {
        const fees = await updateOrderMutate({
          variables: {
            input: {
              orderId: pendingWriteback.digitOrderId,
              ...(pendingWriteback.shippingFees
                ? { shippingFees: pendingWriteback.shippingFees }
                : {}),
              ...(pendingWriteback.shippingCarrierFieldId
                ? { shippingCarrierFieldId: pendingWriteback.shippingCarrierFieldId }
                : {}),
            },
          },
        });
        if (!fees.ok) {
          issues.push({
            status: 'error',
            ssShipmentId: pendingWriteback.ssShipmentId,
            message: `Wrote tracking for label ${pendingWriteback.labelId}, but could not set the ShipStation carrier and shipping fees on the Sutton order: ${fees.error.message}`,
          });
          await writebackDoneMutate({
            path: '/sync/writeback-complete',
            method: 'POST',
            body: {
              organizationId,
              digitShipmentId: pendingWriteback.digitShipmentId,
              digitOrderId: pendingWriteback.digitOrderId,
              recordOnly: true,
              kind: 'order',
              label: orderLabel,
              message: fees.error.message,
            },
          });
        }
      }
      pulled += 1;
      await writebackDoneMutate({
        path: '/sync/writeback-complete',
        method: 'POST',
        body: {
          organizationId,
          digitShipmentId: pendingWriteback.digitShipmentId,
          shipmentLabel,
          orderLabel,
        },
      });
    }

    const failed = issues.filter((issue) => issue.status === 'error');
    setPushNotice({
      severity: failed.length > 0 ? 'error' : pulled > 0 ? 'success' : 'info',
      title:
        failed.length > 0
          ? `Pull from ShipStation could not finish ${failed.length} label(s).`
          : pulled > 0
            ? `Pull from ShipStation wrote ${pulled} ShipStation label(s) into Sutton.`
            : `Pull from ShipStation checked ${candidates} pushed shipment(s) and found no new ShipStation labels.`,
      details: [
        ...issues.map((issue) => issue.message),
        issues.length > 0
          ? ''
          : pulled > 0
            ? 'Carrier, tracking, and shipping cost are written to Sutton when the label exists.'
            : candidates === 0
              ? 'No pushed shipments are waiting on a label. Push from the queue first.'
              : 'Buy the label in ShipStation, then pull again or wait up to five minutes.',
      ].filter(Boolean),
    });
    await Promise.all([
      queue.refetch(),
      mapsQuery.refetch(),
      typesQuery.refetch(),
      onPushComplete?.(),
    ]);
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
      setPdfError('Sutton did not return packing slip PDF data.');
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

  const emptyCopy = emptyQueueCopy(statusFilter);
  const showSelection = canPush && statusFilter !== 'shipped';
  const truncated = Boolean(queue.data?.shipments?.pageInfo?.hasNextPage);

  const queueToolbar = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      alignItems={{ sm: 'center' }}
      justifyContent="space-between"
      sx={{ pb: 1.5, borderBottom: 1, borderColor: 'divider', flex: '0 0 auto' }}
    >
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel id="queue-status-filter-label">Sutton status</InputLabel>
        <Select
          labelId="queue-status-filter-label"
          label="Sutton status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as QueueStatusFilter)}
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
        size="small"
        startIcon={<SyncIcon />}
        onClick={() => void pullFromShipStation()}
        disabled={polling || pushing || !organizationId}
        sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
      >
        {polling ? 'Pulling…' : 'Pull from ShipStation'}
      </Button>
    </Stack>
  );

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
        {pushing ? 'Pushing…' : 'Push to ShipStation'}
      </Button>
    </Stack>
  ) : null;

  return (
    <Stack spacing={1.5} sx={{ flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' }}>
      <SectionHeader
        overline="Queue"
        title="Shipping queue"
        description="Push eligible shipments, buy the label in ShipStation, then pull tracking (or wait five minutes)."
      />

      {hasV1MultiContainer ? (
        <Alert severity="warning">
          ShipStation V1 cannot push shipments with multiple packages. Create one Sutton shipment
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
      {typesQuery.error ? (
        <AppErrorAlert error={typesQuery.error} onRetry={() => void typesQuery.refetch()} />
      ) : null}
      {selectionError ? (
        <Alert severity="error" onClose={() => setSelectionError(null)}>
          {selectionError} The package type was not saved. Pick it again.
        </Alert>
      ) : null}
      {(typesQuery.data?.errors ?? []).length > 0 ? (
        <Alert severity="warning">
          {(typesQuery.data?.errors ?? [])
            .map((entry) => entry.message)
            .filter(Boolean)
            .join(' ')}{' '}
          Carrier packages for that account could not be loaded.
        </Alert>
      ) : null}
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

      {queueToolbar}

      {selectedCount > 0 || showSelection ? pushBar : null}

      <Box sx={{ display: { xs: 'none', md: 'flex' }, flex: 1, minHeight: 0, flexDirection: 'column' }}>
        <TableContainer sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <Table
            size="small"
            stickyHeader
            sx={{
              width: '100%',
              '& .MuiTableCell-root': tableCellSx,
              '& .MuiTableCell-head': {
                bgcolor: 'background.paper',
                whiteSpace: 'nowrap',
              },
            }}
          >
            <TableHead>
              <TableRow>
                {showSelection ? <TableCell sx={selectionHeadCellSx} /> : null}
                <TableCell>Shipment</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Carrier</TableCell>
                <TableCell>Packages</TableCell>
                <TableCell>Push status</TableCell>
                <TableCell>Sutton status</TableCell>
                <TableCell>Tracking status</TableCell>
                <TableCell>ShipStation ID</TableCell>
                <TableCell>Tracking</TableCell>
                <TableCell align="center" sx={filesHeadCellSx}>
                  Files
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nodes.map((shipment) => {
                const map = mapsById.get(shipment.id);
                const label = ticketLabel(shipment);
                const field = effectiveShippingCarrierField(shipment);
                const resolved = resolveSsServiceFromDigitOption({
                  digitOptionId: field?.id,
                  digitValue: field?.value,
                  mappings: orgSettings?.carrierMappings ?? [],
                  ssCarriers: orgSettings?.ssCarriers ?? [],
                });
                const packageReason = missingSelectionReason({
                  containers: shipment.packContainers,
                  selections: selectionsByShipment.get(shipment.id) ?? [],
                  catalog: typesQuery.data,
                  catalogLoaded: typesQuery.data != null,
                  locked: packageSelectionLocked(map),
                  apiVersion,
                  carrierReady: resolved.status === 'ok',
                  carrierId: resolved.carrierId,
                  carrierCode: resolved.carrierCode,
                });
                const blocked =
                  ineligibilityReason({
                    shipment,
                    orgSettings,
                    mapRow: map ?? null,
                    apiVersion,
                    carrierMaps: orgSettings,
                  }) || packageReason;
                const pushDisplay = queuePushDisplay({
                  blocked,
                  mapRow: map,
                  shippingStatus: shipment.shippingStatus,
                });
                const digitChip = digitShippingStatusChip(shipment.shippingStatus);
                const trackingChip = trackingStatusChip(map);
                return (
                  <TableRow key={shipment.id} hover sx={{ ...motionFadeIn, '& > .MuiTableCell-root': { verticalAlign: 'middle' } }}>
                    {showSelection ? (
                      <TableCell sx={selectionBodyCellSx}>
                        {blocked ? (
                          <Tooltip
                            title={`${blocked} ${skipNextStep(blocked)}`}
                            enterDelay={200}
                            enterTouchDelay={0}
                            slotProps={statusTooltipSlotProps}
                          >
                            <span>
                              <Checkbox
                                checked={Boolean(selected[shipment.id])}
                                disabled
                                inputProps={{
                                  'aria-label': `Select shipment ${label}. ${blocked}`,
                                }}
                              />
                            </span>
                          </Tooltip>
                        ) : (
                          <Checkbox
                            checked={Boolean(selected[shipment.id])}
                            onChange={(event) =>
                              setSelected((current) => ({
                                ...current,
                                [shipment.id]: event.target.checked,
                              }))
                            }
                          />
                        )}
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
                      <Typography
                        variant="body2"
                        sx={
                          shipment.shippingCarrierField?.value
                            ? undefined
                            : { color: 'text.disabled' }
                        }
                      >
                        {shipment.shippingCarrierField?.value ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 220 }}>
                      <PackageTypeList
                        shipment={shipment}
                        selections={selectionsByShipment.get(shipment.id) ?? []}
                        orgSettings={orgSettings}
                        apiVersion={apiVersion}
                        catalog={typesQuery.data}
                        catalogLoaded={typesQuery.data != null}
                        catalogLoading={typesQuery.loading}
                        locked={packageSelectionLocked(map)}
                        savingContainerId={savingContainerId}
                        onChange={(containerId, choice) => {
                          void savePackageChoice(shipment.id, containerId, choice);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <QueueStatusDisplay pushDisplay={pushDisplay} />
                    </TableCell>
                    <TableCell>
                      {digitChip ? (
                        <StatusChip color={digitChip.color} label={digitChip.label} />
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {trackingChip ? (
                        <StatusChip color={trackingChip.color} label={trackingChip.label} />
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                          —
                        </Typography>
                      )}
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
                    <TableCell align="center" sx={filesBodyCellSx}>
                      <Stack direction="row" spacing={0.25} justifyContent="center" alignItems="center">
                        <Tooltip
                          title={
                            mapHasLabel(map)
                              ? 'Download shipping label'
                              : 'No shipping label yet. Buy it in ShipStation, then pull from ShipStation.'
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
                  <TableCell colSpan={showSelection ? 11 : 10}>
                    <EmptyState title={emptyCopy.title} description={emptyCopy.description} />
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Stack
        spacing={1.5}
        sx={{
          display: { xs: 'flex', md: 'none' },
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          pb: selectedCount > 0 ? 8 : 0,
        }}
      >
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
            selections={selectionsByShipment.get(shipment.id) ?? []}
            catalog={typesQuery.data}
            catalogLoaded={typesQuery.data != null}
            catalogLoading={typesQuery.loading}
            savingContainerId={savingContainerId}
            onPackageChange={(containerId, choice) => {
              void savePackageChoice(shipment.id, containerId, choice);
            }}
          />
        ))}
        {nodes.length === 0 && !queue.loading ? (
          <EmptyState title={emptyCopy.title} description={emptyCopy.description} />
        ) : null}
      </Stack>

      {truncated ? (
        <Typography variant="caption" sx={{ color: 'text.secondary', flex: '0 0 auto' }}>
          Showing the {PAGE_SIZE} most recent shipments for this filter.
        </Typography>
      ) : null}
    </Stack>
  );
}
