/**
 * Day-boundary helpers. Digit apps have no org timezone field to read, so "today" and
 * day boundaries are computed in the viewer's browser/device local timezone.
 */

export type DayBucket = {
  /** Stable key for matching a returned DailyMetric date to a local calendar day. */
  key: string;
  /** Midnight (local time) for this day. */
  date: Date;
  /** Short label for chart axes, e.g. "Mon 8/4". */
  label: string;
  isToday: boolean;
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local calendar-day key (YYYY-MM-DD) for a given instant, in the viewer's timezone. */
export function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dayLabel(date: Date): string {
  return `${WEEKDAY_LABELS[date.getDay()]} ${date.getMonth() + 1}/${date.getDate()}`;
}

export type DayWindow = {
  /** Oldest → newest, today last. Length is `daysBack + 1`. */
  days: DayBucket[];
  /** ISO instant for the start of the oldest day, for the dailyMetrics query. */
  startDate: string;
  /** ISO instant for the end of today, for the dailyMetrics query. */
  endDate: string;
};

/** Builds today + the prior `daysBack` days, all in the viewer's local timezone. */
export function buildDayWindow(daysBack: number): DayWindow {
  const now = new Date();
  const todayStart = startOfLocalDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const endOfToday = new Date(tomorrowStart.getTime() - 1);

  const oldestStart = new Date(todayStart);
  oldestStart.setDate(oldestStart.getDate() - daysBack);

  const days: DayBucket[] = [];
  for (let i = 0; i <= daysBack; i += 1) {
    const day = new Date(oldestStart);
    day.setDate(oldestStart.getDate() + i);
    days.push({
      key: localDayKey(day),
      date: day,
      label: dayLabel(day),
      isToday: localDayKey(day) === localDayKey(todayStart),
    });
  }

  return {
    days,
    startDate: oldestStart.toISOString(),
    endDate: endOfToday.toISOString(),
  };
}

/** Timezone abbreviation for the viewer, e.g. "PDT", "GMT+2". Best-effort. */
export function localTimezoneAbbreviation(): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short',
      hour: 'numeric',
    }).formatToParts(new Date());
    const tz = parts.find((part) => part.type === 'timeZoneName');
    return tz?.value ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'local time';
  }
}
