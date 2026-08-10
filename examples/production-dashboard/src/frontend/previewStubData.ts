import type { DayBucket } from './dateWindow';
import type { TrackedMetric } from './useDailyMetrics';

/**
 * Demo data for app-store preview screenshots. Remove this file and the
 * USE_PREVIEW_STUB_DATA flag in useDailyMetrics.ts before shipping.
 */
export const USE_PREVIEW_STUB_DATA = true;

/** Oldest → newest, one value per day in `days`. */
const PREVIEW_SERIES: Record<TrackedMetric, number[]> = {
  inventoryQuantityProduced: [820, 945, 1120, 980, 1180, 1050, 1320, 1247],
  numMOsCompleted: [18, 22, 19, 24, 21, 26, 23, 28],
  percentMOsCompletedOnTime: [88, 91, 87, 93, 92, 94, 91, 93],
  numMOsOpenLate: [5, 4, 6, 3, 4, 2, 3, 2],
};

export function buildPreviewStubMetrics(days: DayBucket[]): {
  series: Record<TrackedMetric, Array<number | null>>;
  inventoryQuantityProducedUnit: string;
} {
  const series = {} as Record<TrackedMetric, Array<number | null>>;

  for (const metric of Object.keys(PREVIEW_SERIES) as TrackedMetric[]) {
    const template = PREVIEW_SERIES[metric];
    series[metric] = days.map((_, index) => template[index] ?? template.at(-1) ?? null);
  }

  return {
    series,
    inventoryQuantityProducedUnit: 'ea',
  };
}
