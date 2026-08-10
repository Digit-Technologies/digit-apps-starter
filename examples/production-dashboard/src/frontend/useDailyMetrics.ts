import { useMemo } from 'react';

import { useDigitApiQuery, type AppError } from '@digit/lib-frontend';

import { buildDayWindow, localDayKey, type DayBucket } from './dateWindow';
import { getPreviewStubData } from './previewStubData';

export const TRACKED_METRICS = [
  'inventoryQuantityProduced',
  'numMOsCompleted',
  'percentMOsCompletedOnTime',
  'numMOsOpenLate',
] as const;

export type TrackedMetric = (typeof TRACKED_METRICS)[number];

type MetricValueNode = {
  __typename: string;
  quantity?: number;
  percent?: number;
  measurements?: Array<{ value: number; uom: { symbol: string } }>;
};

type ValueByDateNode = {
  date: string;
  value: MetricValueNode;
};

type DailyMetricNode = {
  metricType: string;
  valuesByDate: ValueByDateNode[];
};

type DailyMetricsData = {
  dailyMetrics: DailyMetricNode[];
};

const DAILY_METRICS_QUERY = `
  query ProductionDashboardDailyMetrics($startDate: DateTimeISO!, $endDate: DateTimeISO!) {
    dailyMetrics(startDate: $startDate, endDate: $endDate) {
      metricType
      valuesByDate {
        date
        value {
          __typename
          ... on MetricNumber {
            quantity
          }
          ... on MetricPercentage {
            percent
          }
          ... on MetricMeasurements {
            measurements {
              value
              uom {
                symbol
              }
            }
          }
        }
      }
    }
  }
`;

function extractNumericValue(value: MetricValueNode): number | null {
  if (value.__typename === 'MetricNumber' && typeof value.quantity === 'number') {
    return value.quantity;
  }
  if (value.__typename === 'MetricPercentage' && typeof value.percent === 'number') {
    return value.percent;
  }
  // MetricCostSums isn't used by any metric this dashboard shows.
  // MetricMeasurements (inventoryQuantityProduced) needs unit-aware handling — see
  // buildMeasurementSeries below, since a plain number can't represent mixed UoMs.
  return null;
}

/**
 * `inventoryQuantityProduced` reports quantities per unit-of-measure (an org can produce
 * items tracked in different UoMs, e.g. "each" vs "kg"), so a day's value is a list of
 * `{ value, uom }` measurements rather than one number. To show a single KPI number, this
 * picks the UoM with the largest total across the window as "primary" and sums only that
 * UoM per day. A day that's missing from the response entirely stays `null` (no data); a
 * day that has a value but no measurement in the primary UoM is a real `0`, not faked.
 */
function buildMeasurementSeries(
  node: DailyMetricNode | undefined,
  days: DayBucket[],
  dayIndexByKey: Map<string, number>,
): { values: Array<number | null>; unitSymbol: string | null } {
  const values: Array<number | null> = new Array(days.length).fill(null);
  if (!node) return { values, unitSymbol: null };

  const totalsByUom = new Map<string, number>();
  const perDayByUom = new Array<Map<string, number> | null>(days.length).fill(null);

  for (const point of node.valuesByDate) {
    const key = localDayKey(new Date(point.date));
    const index = dayIndexByKey.get(key);
    if (index === undefined) continue;

    const measurements = point.value.measurements ?? [];
    const dayTotals = new Map<string, number>();
    for (const measurement of measurements) {
      const symbol = measurement.uom.symbol;
      dayTotals.set(symbol, (dayTotals.get(symbol) ?? 0) + measurement.value);
      totalsByUom.set(symbol, (totalsByUom.get(symbol) ?? 0) + measurement.value);
    }
    // A response entry for this day means data exists for it, even if 0 measurements.
    perDayByUom[index] = dayTotals;
  }

  let primaryUom: string | null = null;
  let bestTotal = -Infinity;
  for (const [symbol, total] of totalsByUom) {
    if (total > bestTotal) {
      bestTotal = total;
      primaryUom = symbol;
    }
  }

  if (primaryUom !== null) {
    for (let i = 0; i < days.length; i += 1) {
      const dayTotals = perDayByUom[i];
      if (dayTotals !== null) values[i] = dayTotals.get(primaryUom) ?? 0;
    }
  }

  return { values, unitSymbol: primaryUom };
}

export type DailyMetricsResult = {
  days: DayBucket[];
  /** Per tracked metric, one value per day (same order/length as `days`). Missing/null = no data. */
  series: Record<TrackedMetric, Array<number | null>>;
  /** Unit-of-measure symbol (e.g. "ea", "kg") backing `inventoryQuantityProduced`, or null if no data. */
  inventoryQuantityProducedUnit: string | null;
  loading: boolean;
  error: ReturnType<typeof useDigitApiQuery<DailyMetricsData>>['error'];
  refetch: () => Promise<void>;
};

const DAYS_BACK = 7; // + today = 8 days total

export function useDailyMetrics(previewMode: boolean = false): DailyMetricsResult {
  const { days, startDate, endDate } = useMemo(() => buildDayWindow(DAYS_BACK), []);

  const { data, error, loading, refetch } = useDigitApiQuery<DailyMetricsData>({
    query: DAILY_METRICS_QUERY,
    variables: { startDate, endDate },
    // Preview mode never needs the real dailyMetrics call.
    skip: previewMode,
  });

  const { series, inventoryQuantityProducedUnit } = useMemo(() => {
    const dayIndexByKey = new Map(days.map((day, index) => [day.key, index]));
    const nodes = data?.dailyMetrics ?? [];
    const nodeByType = new Map(nodes.map((node) => [node.metricType, node]));

    const result: Record<TrackedMetric, Array<number | null>> = {
      inventoryQuantityProduced: new Array(days.length).fill(null),
      numMOsCompleted: new Array(days.length).fill(null),
      percentMOsCompletedOnTime: new Array(days.length).fill(null),
      numMOsOpenLate: new Array(days.length).fill(null),
    };

    const { values: producedValues, unitSymbol } = buildMeasurementSeries(
      nodeByType.get('inventoryQuantityProduced'),
      days,
      dayIndexByKey,
    );
    result.inventoryQuantityProduced = producedValues;

    for (const metric of ['numMOsCompleted', 'percentMOsCompletedOnTime', 'numMOsOpenLate'] as const) {
      const node = nodeByType.get(metric);
      if (!node) continue;
      for (const point of node.valuesByDate) {
        const key = localDayKey(new Date(point.date));
        const index = dayIndexByKey.get(key);
        if (index === undefined) continue;
        const numeric = extractNumericValue(point.value);
        if (numeric !== null) result[metric][index] = numeric;
      }
    }

    return { series: result, inventoryQuantityProducedUnit: unitSymbol };
  }, [data, days]);

  if (previewMode) {
    const stub = getPreviewStubData();
    return {
      days: stub.days,
      series: stub.series,
      inventoryQuantityProducedUnit: stub.inventoryQuantityProducedUnit,
      loading: false,
      error: null,
      refetch,
    };
  }

  return { days, series, inventoryQuantityProducedUnit, loading, error, refetch };
}
