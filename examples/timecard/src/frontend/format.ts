/** Formatting helpers. Everything renders in the browser/device's local timezone. */

/** Local midnight for the given instant. */
export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Local midnight the following day (exclusive upper bound for "today"). */
export function endOfLocalDay(date: Date): Date {
  const start = startOfLocalDay(date);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
}

/** e.g. "9:41 AM PDT" */
export function formatTimeWithZone(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

/** e.g. "9:41 AM" (no zone — for compact ranges where the zone is shown once). */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Short timezone abbreviation for "now", e.g. "PDT". */
export function currentZoneAbbreviation(): string {
  const parts = new Date().toLocaleTimeString(undefined, { timeZoneName: 'short' }).split(' ');
  return parts[parts.length - 1] ?? '';
}

/** e.g. "Aug 10, 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** e.g. "3h 42m" (seconds truncated to whole minutes). */
export function formatDurationHM(totalSeconds: number): string {
  const totalMinutes = Math.max(0, Math.floor(totalSeconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}
