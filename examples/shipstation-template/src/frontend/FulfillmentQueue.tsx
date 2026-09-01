import { useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
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

import ActivityLog, { useActivityQuery } from './ActivityLog';
import {
  ineligibilityReason,
  pushStatusLabel,
  skipNextStep,
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

function inventoryLabel(order: OrderNode) {
  const lines = (order.items ?? []).filter(
    (line) => Number(line.quantity) - Number(line.totalShippedQuantity ?? 0) > 0,
  );
  if (lines.length === 0) return '—';
  return lines.every((line) => line.itemAvailability === 'fully_available') ? 'Ready' : 'Backorder';
}

function statusChip(value: string | null | undefined) {
  if (!value) return '—';
  return value.replace(/_/g, ' ');
}

function orderLabel(order: OrderNode) {
  return order.documentNumber || order.orderNumber || order.id.slice(0, 8);
}

export default function FulfillmentQueue({
  organizationId,
  canPush,
  pushDisabledReason = null,
  orgSettings = null,
}: {
  organizationId: string;
  canPush: boolean;
  pushDisabledReason?: string | null;
  orgSettings?: OrgSettingsForEligibility | null;
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
  const activityQuery = useActivityQuery(organizationId);

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
    await Promise.all([queue.refetch(), mapsQuery.refetch(), activityQuery.refetch()]);
  };

  const pageInfo = queue.data?.orders?.pageInfo;

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap">
        <Typography variant="h2" component="h2">
          Fulfillment queue
        </Typography>
        {canPush ? (
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            {pushDisabledReason ? (
              <Typography variant="body2" sx={{ color: 'warning.main' }}>
                {pushDisabledReason}
              </Typography>
            ) : null}
            <Button
              variant="contained"
              onClick={() => void pushSelected()}
              disabled={pushing || Boolean(pushDisabledReason)}
            >
              {pushing ? 'Pushing…' : 'Push selected'}
            </Button>
          </Stack>
        ) : null}
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Pick and pack in Digit, then push packed orders to ShipStation to print labels. A successful
        push creates a ShipStation shipment; the Digit sales order stays in this queue until it is
        fulfilled. Tracking writes back when a label is purchased.
      </Typography>

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

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {canPush ? <TableCell padding="checkbox" /> : null}
              <TableCell>Order</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Pick</TableCell>
              <TableCell>Pack</TableCell>
              <TableCell>Inventory</TableCell>
              <TableCell>Ready</TableCell>
              <TableCell>ShipStation</TableCell>
              <TableCell>Tracking</TableCell>
              <TableCell>Status</TableCell>
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
              const readyTitle = blocked ? `${blocked} ${skipNextStep(blocked)}` : 'Eligible to push.';
              return (
                <TableRow key={order.id} hover>
                  {canPush ? (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={Boolean(selected[order.id])}
                        onChange={(event) =>
                          setSelected((current) => ({ ...current, [order.id]: event.target.checked }))
                        }
                      />
                    </TableCell>
                  ) : null}
                  <TableCell>{label}</TableCell>
                  <TableCell>{order.customer?.name ?? '—'}</TableCell>
                  <TableCell>{statusChip(order.pickingStatus)}</TableCell>
                  <TableCell>{statusChip(order.packingStatus)}</TableCell>
                  <TableCell>{inventoryLabel(order)}</TableCell>
                  <TableCell>
                    <Tooltip title={readyTitle}>
                      <Chip
                        size="small"
                        color={blocked ? 'warning' : 'success'}
                        label={blocked ? 'Blocked' : 'Ready'}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <span>{map?.ssShipmentId ?? '—'}</span>
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
                  <TableCell>{map?.trackingNumber ?? '—'}</TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2">{pushStatusLabel(map?.pushStatus)}</Typography>
                      {map?.lastError ? (
                        <Tooltip title={map.lastError}>
                          <Chip
                            size="small"
                            color="warning"
                            label={map.lastError}
                            sx={{
                              maxWidth: 280,
                              '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                            }}
                          />
                        </Tooltip>
                      ) : null}
                    </Stack>
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
                <TableCell colSpan={canPush ? 11 : 10}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
                    No open sales orders.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>

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

      <ActivityLog query={activityQuery} />
    </Stack>
  );
}
