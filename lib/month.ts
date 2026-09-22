/**
 * Month helpers.
 *
 * Every month in the system is represented by a `Date` pinned to UTC midnight
 * on the first of that month, and by a `YYYY-MM` string in URLs. Working in UTC
 * keeps month boundaries stable no matter which timezone the browser is in
 * (Nepal is UTC+05:45, so local-midnight dates would drift a day).
 */

export const MONTH_PARAM = "m";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const SHORT_MONTH_NAMES = MONTH_NAMES.map((m) => m.slice(0, 3));

/** UTC midnight on the first of the month containing `date`. */
export function monthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** Exclusive upper bound: UTC midnight on the first of the *next* month. */
export function monthEnd(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
}

/** The month the user is in right now, derived from their local calendar. */
export function currentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
}

/** Today as a UTC-midnight date-only value. */
export function today(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/** `YYYY-MM` — the canonical URL/serialisation form for a month. */
export function toMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** `YYYY-MM-DD` for a date-only value. */
export function toDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")}`;
}

/**
 * Parse `YYYY-MM-DD` into a UTC-midnight date. Returns null when malformed.
 *
 * `Date.UTC` silently rolls impossible dates forward — 2026-02-30 becomes
 * 2 March — so the parsed parts are compared back against the input and a date
 * that did not survive the round trip is rejected.
 */
export function parseDateKey(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Parse a `YYYY-MM` search param into a month. Falls back to the current month
 * so a hand-edited URL can never crash a page.
 */
export function parseMonthKey(value: string | null | undefined): Date {
  if (!value) return currentMonth();
  const match = /^(\d{4})-(\d{1,2})$/.exec(value.trim());
  if (!match) return currentMonth();
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12 || year < 1970 || year > 2200) return currentMonth();
  return new Date(Date.UTC(year, month - 1, 1));
}

/** "September 2026" */
export function formatMonthLabel(date: Date): string {
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** "Sep 2026" */
export function formatMonthShort(date: Date): string {
  return `${SHORT_MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** "Sep 22" — used in dense transaction lists. */
export function formatDayShort(date: Date): string {
  return `${SHORT_MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/** "22 September 2026" */
export function formatDateLong(date: Date): string {
  return `${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
}

/** Inclusive list of month starts from `from` to `to`. */
export function monthRange(from: Date, to: Date): Date[] {
  const months: Date[] = [];
  let cursor = monthStart(from);
  const last = monthStart(to);
  // Guard against inverted ranges and runaway loops.
  let guard = 0;
  while (cursor.getTime() <= last.getTime() && guard < 1200) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
    guard += 1;
  }
  return months;
}

/** The `count` months ending at (and including) `end`, oldest first. */
export function lastNMonths(end: Date, count: number): Date[] {
  return monthRange(addMonths(end, -(count - 1)), end);
}

/** Quarter index (1-4) for a month. */
export function quarterOf(date: Date): number {
  return Math.floor(date.getUTCMonth() / 3) + 1;
}

export function yearStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

export function quarterStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), (quarterOf(date) - 1) * 3, 1));
}

/** Number of days in the month containing `date`. */
export function daysInMonth(date: Date): number {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}
