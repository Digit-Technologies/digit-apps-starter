import { useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
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
import DownloadIcon from '@mui/icons-material/Download';

import {
  AppErrorAlert,
  useBackendMutation,
  useBackendQuery,
  useDigitApiQuery,
} from '@digit/lib-frontend';

import EmptyState from './components/EmptyState';
import FulfillmentLane from './components/FulfillmentLane';
import OrderQueueCard from './components/OrderQueueCard';
import QueueStatusDisplay from './components/QueueStatusDisplay';
import SectionHeader from './components/SectionHeader';
import { motionFadeIn } from './components/motion';
import {
  ineligibilityReason,
  queuePushDisplay,
  type OrgSettingsForEligibility,
} from './eligibility';

const PAGE_SIZE = 10;

const QUEUE_QUERY = `
  query ShipStationQueue($connection: ConnectionInput) {
    orders(
      orderStatuses: [unfulfilled, partially_fulfilled]
      connection: $connection
      order: { by: createdAt, direction: desc }
    ) {
      pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
      nodes {
        id
        documentNumber
        orderNumber
        orderStatus
        packingStatus
        pickingStatus
        customer { name }
        tags { id value }
        items {
          quantity
          itemAvailability
          totalShippedQuantity
        }
      }
    }
  }
`;

const PDF_QUERY = `
  query ShipStationSlip($orderId: ID!) {
    generateSalesOrderPdf(orderId: $orderId) { url }
  }
`;

type OrderNode = {
  id: string;
  documentNumber?: string | null;
  orderNumber?: string | null;
  orderStatus?: string | null;
  packingStatus?: string | null;
  pickingStatus?: string | null;
  customer?: { name?: string | null } | null;
  tags?: { id: string; value: string }[] | null;
  items?: { quantity: number; itemAvailability?: string | null; totalShippedQuantity?: number }[] | null;
};

type QueueData = {
  orders?: {
    pageInfo?: {
      hasNextPage?: boolean;
      hasPreviousPage?: boolean;
      startCursor?: string | null;
      endCursor?: string | null;
    };
    nodes?: OrderNode[];
  };
};

type MapRow = {
  digitOrderId: string;
  ssShipmentId?: string | null;
  source?: string | null;
  pushStatus?: string | null;
  lastError?: string | null;
  trackingNumber?: string | null;
};

type MapsData = { maps: MapRow[] };

type PdfData = { generateSalesOrderPdf?: { url: string } | null };

type PushResult = {
  orderId: string;
  ok: boolean;
  skipped: boolean;
  ssShipmentId?: string | null;
  message?: string | null;
  meaning?: string | null;
};

type PushData = {
  results: PushResult[];
  summary: { pushed: number; skipped: number; failed: number };
};

function orderLabel(order: OrderNode) {
  return order.documentNumber || order.orderNumber || order.id.slice(0, 8);
}

function salesOrderPath(orderId: string) {
  return `/sales/orders/${orderId}`;
}

function OrderLink({ orderId, label }: { orderId: string; label: string }) {
  const navigate = window.DigitHost?.navigate;
  if (!navigate) return label;
  return (
    <Link
      component="button"
      type="button"
      underline="hover"
      onClick={() => navigate({ path: salesOrderPath(orderId) })}
      sx={{ typography: 'body1Link', color: 'inherit', verticalAlign: 'inherit' }}
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
  pushDisabledReason = null,
  orgSettings = null,
  onPushComplete,
}: {
  organizationId: string;
  canPush: boolean;
  pushDisabledReason?: string | null;
  orgSettings?: OrgSettingsForEligibility | null;
  onPushComplete?: () => void | Promise<void>;
}) {
  const [after, setAfter] = useState<string | null>(null);
  const [before, setBefore] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [pdfOrderId, setPdfOrderId] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pushNotice, setPushNotice] = useState<{
    severity: 'success' | 'warning' | 'error';
    title: string;
    details: string[];
  } | null>(null);

  const queue = useDigitApiQuery<QueueData>({
    query: QUEUE_QUERY,
    variables: {
      connection: after
        ? { first: PAGE_SIZE, after }
        : before
          ? { last: PAGE_SIZE, before }
          : { first: PAGE_SIZE },
    },
  });

  const nodes = queue.data?.orders?.nodes ?? [];
  const orderIds = nodes.map((node) => node.id).join(',');
  const mapsQuery = useBackendQuery<MapsData>({
    path: `/sync/orders?organizationId=${encodeURIComponent(organizationId)}&orderIds=${encodeURIComponent(orderIds)}`,
    skip: !organizationId || nodes.length === 0,
  });

  const mapsById = useMemo(() => {
    const map = new Map<string, MapRow>();
    for (const row of mapsQuery.data?.maps ?? []) map.set(row.digitOrderId, row);
    return map;
  }, [mapsQuery.data]);

  const [mutate, { error: pushError, loading: pushing, reset }] = useBackendMutation<PushData>();

  const pdf = useDigitApiQuery<PdfData>({
    query: PDF_QUERY,
    variables: { orderId: pdfOrderId },
    skip: !pdfOrderId,
  });

  useEffect(() => {
    const url = pdf.data?.generateSalesOrderPdf?.url;
    if (!url || !pdfOrderId) return;
    void (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          setPdfError(`Packing slip download failed (HTTP ${response.status}).`);
          return;
        }
        const buffer = await response.arrayBuffer();
        window.DigitHost?.download({
          filename: `packing-slip-${pdfOrderId}.pdf`,
          contentType: 'application/pdf',
          data: buffer,
        });
        setPdfError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Packing slip download failed.';
        setPdfError(message);
      } finally {
        setPdfOrderId(null);
      }
    })();
  }, [pdf.data, pdfOrderId]);

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const pushSelected = async () => {
    const orderIdsToPush = Object.entries(selected)
      .filter(([, on]) => on)
      .map(([id]) => id);
    if (orderIdsToPush.length === 0) return;
    reset();
    setPushNotice(null);
    const result = await mutate({
      path: '/sync/push',
      method: 'POST',
      body: { organizationId, orderIds: orderIdsToPush },
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
        if (row.ok && !row.skipped) next[row.orderId] = false;
      }
      return next;
    });
    await Promise.all([queue.refetch(), mapsQuery.refetch(), onPushComplete?.()]);
  };

  const pageInfo = queue.data?.orders?.pageInfo;

  const pushBar = canPush ? (
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
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {selectedCount > 0
          ? `${selectedCount} order${selectedCount === 1 ? '' : 's'} selected`
          : pushDisabledReason ?? 'Select orders to push'}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        {pushDisabledReason && selectedCount === 0 ? (
          <Typography variant="body2" sx={{ color: 'warning.main', display: { xs: 'none', sm: 'block' } }}>
            {pushDisabledReason}
          </Typography>
        ) : null}
        <Button
          variant="contained"
          onClick={() => void pushSelected()}
          disabled={pushing || Boolean(pushDisabledReason) || selectedCount === 0}
        >
          {pushing ? 'Pushing…' : 'Push selected'}
        </Button>
      </Stack>
    </Stack>
  ) : null;

  return (
    <Stack spacing={2}>
      <SectionHeader
        overline="Queue"
        title="Fulfillment queue"
        description="Pick and pack in Digit, then push orders to ShipStation. Tracking writes back when a label is purchased."
      />

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
      {pdf.error && <AppErrorAlert error={pdf.error} />}
      {pdfError ? (
        <Alert severity="error" onClose={() => setPdfError(null)}>
          {pdfError}
        </Alert>
      ) : null}

      {selectedCount > 0 || canPush ? pushBar : null}

      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%' }}>
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                {canPush ? <TableCell padding="checkbox" sx={selectionHeadCellSx} /> : null}
                <TableCell>Order</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Lane</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>ShipStation ID</TableCell>
                <TableCell>Tracking</TableCell>
                <TableCell align="right">Slip</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nodes.map((order) => {
                const map = mapsById.get(order.id);
                const label = orderLabel(order);
                const blocked = ineligibilityReason({
                  order,
                  orgSettings,
                  mapRow: map ?? null,
                });
                const pushDisplay = queuePushDisplay({ blocked, mapRow: map ?? null });
                return (
                  <TableRow key={order.id} hover sx={motionFadeIn}>
                    {canPush ? (
                      <TableCell padding="checkbox" sx={selectionBodyCellSx}>
                        <Checkbox
                          checked={Boolean(selected[order.id])}
                          onChange={(event) =>
                            setSelected((current) => ({ ...current, [order.id]: event.target.checked }))
                          }
                        />
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <OrderLink orderId={order.id} label={label} />
                    </TableCell>
                    <TableCell>{order.customer?.name ?? '—'}</TableCell>
                    <TableCell>
                      <FulfillmentLane order={order} mapRow={map ?? null} orgSettings={orgSettings} />
                    </TableCell>
                    <TableCell>
                      <QueueStatusDisplay pushDisplay={pushDisplay} />
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
                      <IconButton
                        size="small"
                        aria-label="Download packing slip"
                        onClick={() => {
                          setPdfError(null);
                          setPdfOrderId(order.id);
                        }}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {nodes.length === 0 && !queue.loading ? (
                <TableRow>
                  <TableCell colSpan={canPush ? 8 : 7}>
                    <EmptyState
                      title="No orders waiting to ship"
                      description="Unfulfilled and partially fulfilled sales orders show up here. Push packed orders to create ShipStation shipments."
                    />
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' }, pb: selectedCount > 0 ? 8 : 0 }}>
        {nodes.map((order) => (
          <OrderQueueCard
            key={order.id}
            order={order}
            map={mapsById.get(order.id)}
            orgSettings={orgSettings}
            canPush={canPush}
            selected={Boolean(selected[order.id])}
            onSelect={(checked) => setSelected((current) => ({ ...current, [order.id]: checked }))}
            onCopySsId={(id) => {
              void navigator.clipboard.writeText(id);
              setCopyHint(id);
            }}
            copyHint={copyHint}
            onDownloadSlip={() => {
              setPdfError(null);
              setPdfOrderId(order.id);
            }}
          />
        ))}
        {nodes.length === 0 && !queue.loading ? (
          <EmptyState
            title="No orders waiting to ship"
            description="Unfulfilled and partially fulfilled sales orders show up here. Push packed orders to create ShipStation shipments."
          />
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

      <Box sx={{ display: 'none' }} aria-hidden>
        {pdf.loading ? 'pdf' : null}
      </Box>
    </Stack>
  );
}
