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

/** Inclusive, gap-free list of YYYY-MM-DD days from start to end. */
export function daysBetween(start: string, end: string): string[] {
  const days: string[] = [];
  const last = new Date(`${end}T00:00:00Z`);
  for (let d = new Date(`${start}T00:00:00Z`); d <= last; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/** True for a real calendar date in YYYY-MM-DD form. */
export function isValidDay(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

const DAY_LABEL = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

/** e.g. "Thu, Oct 10, 2026" — in IST. */
export function istDateLabel(now: Date = new Date()): string {
  return DAY_LABEL.format(now);
}

/** Time-of-day greeting based on the current IST hour. */
export function istGreeting(now: Date = new Date()): string {
  const hour = new Date(now.getTime() + IST_MS).getUTCHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}
