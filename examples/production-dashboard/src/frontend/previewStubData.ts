/**
 * Preview stub data — realistic-looking numbers for demoing/screenshotting the dashboard
 * layout without needing real manufacturing activity. Toggled at runtime via a switch in
 * the header (see `App.tsx`); this file only supplies the fake data, it does not decide
 * when it's shown. When the toggle is on, a "Preview data" chip renders next to the
 * header so the fake numbers are never mistaken for live output.
 */

import { buildDayWindow, type DayBucket } from './dateWindow';

type PreviewMetricKey =
  | 'inventoryQuantityProduced'
  | 'numMOsCompleted'
  | 'percentMOsCompletedOnTime'
  | 'numMOsOpenLate';

const DAYS_BACK = 7; // matches useDailyMetrics' real window (today + prior 7 days)

export type PreviewStubData = {
  days: DayBucket[];
  series: Record<PreviewMetricKey, Array<number | null>>;
  inventoryQuantityProducedUnit: string | null;
};

/** Oldest → newest, today last — same shape/order as the real 8-day series. */
export function getPreviewStubData(): PreviewStubData {
  const { days } = buildDayWindow(DAYS_BACK);

  return {
    days,
    series: {
      inventoryQuantityProduced: [420, 455, 480, 460, 500, 475, 510, 540],
      numMOsCompleted: [8, 10, 9, 11, 10, 12, 11, 13],
      percentMOsCompletedOnTime: [92, 88, 95, 90, 93, 89, 94, 96],
      numMOsOpenLate: [2, 1, 3, 1, 2, 1, 0, 1],
    },
    inventoryQuantityProducedUnit: 'ea',
  };
}
