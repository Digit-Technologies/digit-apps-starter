import { useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type OrderNode = {
  id: string;
  orderNumber?: string | null;
  orderDate?: string | null;
  orderStatus?: string | null;
  shippedPercentage?: number | null;
  customer?: { name?: string | null } | null;
  totalOrderAmount?: { costAmount?: number | null; currency?: { code?: string | null } | null } | null;
};

type OrdersResult = {
  data?: {
    orders?: {
      totalCount?: number;
      nodes?: OrderNode[];
    };
  };
  errors?: Array<{ message: string }>;
  error?: { code: string; message: string };
};

const ORDERS_QUERY = `
  query RecentSalesOrders($connection: ConnectionInput, $order: OrderOrderInput) {
    orders(connection: $connection, order: $order) {
      totalCount
      nodes {
        id
        orderNumber
        orderDate
        orderStatus
        shippedPercentage
        customer {
          name
        }
        totalOrderAmount {
          costAmount
          currency {
            code
          }
        }
      }
    }
  }
`;

const RECENT_ORDER_COUNT = 20;

// Orders in these statuses aren't progressing toward fulfillment; the bar reflects
// the status itself rather than shippedPercentage.
const STOPPED_STATUSES = new Set(['cancelled', 'returned', 'refunded']);

const DONE_STATUSES = new Set(['fulfilled', 'closed']);

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  requested: 'Requested',
  unfulfilled: 'Unfulfilled',
  partially_fulfilled: 'Partially fulfilled',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
  closed: 'Closed',
};

type LoadState =
  | { status: 'loading' }
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'loaded'; nodes: OrderNode[] };

function progressPercent(order: OrderNode): number {
  if (DONE_STATUSES.has(order.orderStatus ?? '')) return 100;
  const raw = Number(order.shippedPercentage);
  if (!Number.isFinite(raw)) return 0;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatAmount(value?: number | null, currencyCode?: string | null): string {
  const amount = Number(value) || 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode || 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
}

async function loadRecentOrders(): Promise<LoadState> {
  const client = window.DigitProxyClient;
  if (!client) {
    return {
      status: 'unavailable',
      message: 'DigitProxyClient is unavailable. This page only works inside the Digit app harness.',
    };
  }

  try {
    const result = (await client.callProxy({
      query: ORDERS_QUERY,
      variables: {
        connection: { first: RECENT_ORDER_COUNT },
        order: { by: 'orderDate', direction: 'desc' },
      },
    })) as OrdersResult;

    if (result.error) {
      return { status: 'error', message: `${result.error.code}: ${result.error.message}` };
    }
    if (result.errors?.length) {
      return { status: 'error', message: result.errors.map((e) => e.message).join('; ') };
    }

    const nodes = result.data?.orders?.nodes ?? [];
    return nodes.length ? { status: 'loaded', nodes } : { status: 'empty' };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Request failed' };
  }
}

function OrderCard({ order }: { order: OrderNode }) {
  const status = order.orderStatus ?? 'unfulfilled';
  const stopped = STOPPED_STATUSES.has(status);
  const percent = progressPercent(order);
  const statusLabel = STATUS_LABELS[status] ?? status;

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'border.default',
        borderRadius: 2,
        display: 'grid',
        gap: 1.2,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={2}>
        <Stack spacing={0.2}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {order.orderNumber ?? order.id}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {order.customer?.name ?? 'Unknown customer'}
          </Typography>
        </Stack>
        <Stack alignItems="flex-end" spacing={0.2}>
          <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {formatDate(order.orderDate)}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
            {formatAmount(order.totalOrderAmount?.costAmount, order.totalOrderAmount?.currency?.code)}
          </Typography>
        </Stack>
      </Stack>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <LinearProgress
          variant="determinate"
          value={percent}
          color={stopped ? 'error' : 'primary'}
          sx={{ flex: 1, height: 8, borderRadius: 999 }}
        />
        <Chip
          label={statusLabel}
          size="small"
          variant="outlined"
          color={DONE_STATUSES.has(status) ? 'success' : stopped ? 'error' : 'default'}
        />
      </Stack>
    </Box>
  );
}

export default function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    void loadRecentOrders().then(setState);
  }, []);

  return (
    <Box sx={{ maxWidth: '40rem', mx: 'auto', px: 3, py: 5 }}>
      <Typography variant="overline" component="p" sx={{ color: 'primary.main', mb: 1 }}>
        Digit API
      </Typography>
      <Typography variant="h1" component="h1" sx={{ mb: 1 }}>
        Recent Sales Orders
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
        The {RECENT_ORDER_COUNT} most recent orders and their progress to completion.
      </Typography>

      {state.status === 'loading' && (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <CircularProgress size={18} />
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Loading…
          </Typography>
        </Stack>
      )}

      {state.status === 'unavailable' && <Alert severity="info">{state.message}</Alert>}
      {state.status === 'error' && <Alert severity="error">{state.message}</Alert>}
      {state.status === 'empty' && (
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          No sales orders found.
        </Typography>
      )}

      {state.status === 'loaded' && (
        <Stack spacing={1} sx={{ mt: 1 }}>
          {state.nodes.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
