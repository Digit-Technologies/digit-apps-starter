import { useEffect, useMemo, useState } from 'react';

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
  pushStatus?: string | null;
  lastError?: string | null;
  trackingNumber?: string | null;
};

type MapsData = { maps: MapRow[] };

type PdfData = { generateSalesOrderPdf?: { url: string } | null };

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

export default function FulfillmentQueue({
  organizationId,
  canPush,
}: {
  organizationId: string;
  canPush: boolean;
}) {
  const [after, setAfter] = useState<string | null>(null);
  const [before, setBefore] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [pdfOrderId, setPdfOrderId] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);

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

  const [mutate, { error: pushError, loading: pushing, reset }] = useBackendMutation();

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
        const buffer = await response.arrayBuffer();
        window.DigitHost?.download({
          filename: `packing-slip-${pdfOrderId}.pdf`,
          contentType: 'application/pdf',
          data: buffer,
        });
      } catch {
        /* host download throws with a reason */
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
    await mutate({
      path: '/sync/push',
      method: 'POST',
      body: { organizationId, orderIds: orderIdsToPush },
    });
    setSelected({});
    await Promise.all([queue.refetch(), mapsQuery.refetch()]);
  };

  const pageInfo = queue.data?.orders?.pageInfo;

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap">
        <Typography variant="h2" component="h2">
          Fulfillment queue
        </Typography>
        {canPush ? (
          <Button variant="contained" onClick={() => void pushSelected()} disabled={pushing}>
            {pushing ? 'Pushing…' : 'Push selected'}
          </Button>
        ) : null}
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Pick and pack in Digit, then push packed orders to ShipStation to print labels. Tracking
        writes back when a label is purchased.
      </Typography>

      {queue.error && <AppErrorAlert error={queue.error} onRetry={() => void queue.refetch()} />}
      {mapsQuery.error && (
        <AppErrorAlert error={mapsQuery.error} onRetry={() => void mapsQuery.refetch()} />
      )}
      {pushError && <AppErrorAlert error={pushError} />}
      {pdf.error && <AppErrorAlert error={pdf.error} />}

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
              <TableCell>ShipStation</TableCell>
              <TableCell>Tracking</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Slip</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {nodes.map((order) => {
              const map = mapsById.get(order.id);
              const label = order.documentNumber || order.orderNumber || order.id.slice(0, 8);
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
                    {map?.lastError ? (
                      <Chip size="small" color="warning" label={map.lastError} sx={{ maxWidth: 220 }} />
                    ) : (
                      statusChip(map?.pushStatus)
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      aria-label="Download packing slip"
                      onClick={() => setPdfOrderId(order.id)}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {nodes.length === 0 && !queue.loading ? (
              <TableRow>
                <TableCell colSpan={canPush ? 10 : 9}>
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
    </Stack>
  );
}
