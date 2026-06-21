// All calendar-date logic uses IST (India Standard Time, UTC+05:30):
// "today", day boundaries, and the per-day windows sent to GitHub — so commits
// bucket by IST midnight regardless of where the server runs.

const IST_OFFSET = "+05:30";
const IST_MS = 5.5 * 60 * 60 * 1000;

/** Current date in IST, as YYYY-MM-DD. */
export function istToday(): string {
  return new Date(Date.now() + IST_MS).toISOString().slice(0, 10);
}

/** Start-of-day instant for an IST calendar day (ISO 8601 with offset). */
export function istDayStart(date: string): string {
  return `${date}T00:00:00${IST_OFFSET}`;
}

/** End-of-day instant for an IST calendar day (ISO 8601 with offset). */
export function istDayEnd(date: string): string {
  return `${date}T23:59:59${IST_OFFSET}`;
}
