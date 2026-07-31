import { useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

type OrderNode = {
  id: string;
  totalOrderAmount?: { costAmount?: number | null; currency?: { code?: string | null } | null } | null;
  customer?: { id?: string | null; name?: string | null } | null;
};

type OrdersResult = {
  data?: {
    orders?: {
      totalCount?: number;
      pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
      nodes?: OrderNode[];
    };
  };
  errors?: Array<{ message: string }>;
  error?: { code: string; message: string };
};

const ORDERS_QUERY = `
  query TopCustomerOrders($connection: ConnectionInput) {
    orders(connection: $connection) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        totalOrderAmount {
          costAmount
          currency {
            code
          }
        }
        customer {
          id
          name
        }
      }
    }
  }
`;

const PAGE_SIZE = 100;
const MAX_ORDERS = 5000;
const TOP_N = 10;

type RankedCustomer = {
  name: string;
  total: number;
  orderCount: number;
  currencyCode?: string | null;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'loaded'; ranked: RankedCustomer[]; fetched: number; customerCount: number; multiCurrency: boolean; truncated: boolean };

function toAmount(value: OrderNode['totalOrderAmount']): number {
  return Number(value?.costAmount) || 0;
}

function formatAmount(value: number, currencyCode?: string | null): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode || 'USD',
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

async function loadTopCustomers(): Promise<LoadState> {
  const client = window.DigitProxyClient;
  if (!client) {
    return {
      status: 'unavailable',
      message: 'DigitProxyClient is unavailable. This page only works inside the Digit app harness.',
    };
  }

  const totals = new Map<string, RankedCustomer>();
  const currencySet = new Set<string>();
  let after: string | undefined;
  let fetched = 0;

  try {
    while (fetched < MAX_ORDERS) {
      const result = (await client.callProxy({
        query: ORDERS_QUERY,
        variables: { connection: { first: PAGE_SIZE, after } },
      })) as OrdersResult;

      if (result.error) {
        return { status: 'error', message: `${result.error.code}: ${result.error.message}` };
      }
      if (result.errors?.length) {
        return { status: 'error', message: result.errors.map((e) => e.message).join('; ') };
      }

      const orders = result.data?.orders;
      const nodes = orders?.nodes ?? [];

      for (const order of nodes) {
        const customerId = order.customer?.id ?? 'unknown';
        const customerName = order.customer?.name ?? 'Unknown customer';
        const amount = toAmount(order.totalOrderAmount);
        const currencyCode = order.totalOrderAmount?.currency?.code;
        if (currencyCode) currencySet.add(currencyCode);

        const existing = totals.get(customerId);
        if (existing) {
          existing.total += amount;
          existing.orderCount += 1;
        } else {
          totals.set(customerId, {
            name: customerName,
            total: amount,
            orderCount: 1,
            currencyCode,
          });
        }
      }

      fetched += nodes.length;

      if (!orders?.pageInfo?.hasNextPage || !orders.pageInfo.endCursor) {
        break;
      }
      after = orders.pageInfo.endCursor;
    }

    const ranked = Array.from(totals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, TOP_N);

    if (!ranked.length) {
      return { status: 'empty' };
    }

    return {
      status: 'loaded',
      ranked,
      fetched,
      customerCount: totals.size,
      multiCurrency: currencySet.size > 1,
      truncated: fetched >= MAX_ORDERS,
    };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Request failed' };
  }
}

export default function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    void loadTopCustomers().then(setState);
  }, []);

  const notes: string[] = [];
  if (state.status === 'loaded') {
    notes.push(`Based on ${state.fetched} order(s) across ${state.customerCount} customer(s).`);
    if (state.multiCurrency) {
      notes.push('Multiple currency codes were present; totals are summed without conversion.');
    }
    if (state.truncated) {
      notes.push(`Stopped after the first ${MAX_ORDERS} orders.`);
    }
  }

  return (
    <Box sx={{ maxWidth: '42rem', mx: 'auto', px: 3, py: 5 }}>
      <Typography variant="overline" component="p" sx={{ color: 'primary.main', mb: 1 }}>
        Digit API
      </Typography>
      <Typography variant="h1" component="h1" sx={{ mb: 1 }}>
        Top Customers
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
        Ranked by total sales order amount, loaded through <code>DigitProxyClient</code>.
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
        <>
          <Table size="small" sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', width: '2.5rem' }}>#</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>Customer</TableCell>
                <TableCell align="right" sx={{ color: 'text.secondary' }}>
                  Orders
                </TableCell>
                <TableCell align="right" sx={{ color: 'text.secondary' }}>
                  Total
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.ranked.map((customer, index) => (
                <TableRow key={`${customer.name}-${index}`} hover>
                  <TableCell sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                    {index + 1}
                  </TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                    {customer.orderCount}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {formatAmount(customer.total, customer.currencyCode)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1.5 }}>
            {notes.join(' ')}
          </Typography>
        </>
      )}
    </Box>
  );
}
