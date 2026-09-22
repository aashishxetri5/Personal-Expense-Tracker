/**
 * Month and date helpers. Every month is a `Date` at UTC midnight on the 1st,
 * and every URL carries it as `YYYY-MM`. Working in UTC keeps month boundaries
 * stable — Nepal is UTC+05:45, so local-midnight dates would drift a day.
 */

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

const SHORT_MONTH_NAMES = MONTH_NAMES.map((name) => name.slice(0, 3));

/**
 * Finds the first day of the month containing a date.
 *
 * @param date - Any date.
 * @returns UTC midnight on the 1st of that month.
 */
export function monthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/**
 * Finds the exclusive upper bound of a month, for range queries.
 *
 * @param date - Any date in the month.
 * @returns UTC midnight on the 1st of the following month.
 */
export function monthEnd(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

/**
 * Shifts a month forwards or backwards, crossing years correctly.
 *
 * @param date - The starting month.
 * @param amount - Months to add; negative moves backwards.
 * @returns The first day of the resulting month.
 */
export function addMonths(date: Date, amount: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
}

/**
 * Determines the month the user is currently in, from their local calendar.
 *
 * @returns UTC midnight on the 1st of the current month.
 */
export function currentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
}

/**
 * Determines today's date, from the user's local calendar.
 *
 * @returns Today as a UTC-midnight, date-only value.
 */
export function today(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/**
 * Serialises a month for a URL or a lookup key.
 *
 * @param date - Any date in the month.
 * @returns The month as `YYYY-MM`.
 */
export function toMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Serialises a date-only value.
 *
 * @param date - The date to serialise.
 * @returns The date as `YYYY-MM-DD`.
 */
export function toDateKey(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

/**
 * Parses `YYYY-MM-DD`, rejecting dates that do not exist. `Date.UTC` rolls
 * 2026-02-30 forward to March, so the parts are compared back to the input.
 *
 * @param value - The date string, or null/undefined.
 * @returns The UTC-midnight date, or null when malformed or impossible.
 */
export function parseDateKey(value: string | null | undefined): Date | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  const survivedRoundTrip =
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return survivedRoundTrip ? date : null;
}

/**
 * Parses a `YYYY-MM` search param, never throwing on a hand-edited URL.
 *
 * @param value - The month string, or null/undefined.
 * @returns The month, falling back to the current one when unusable.
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

/**
 * Formats a month in full, e.g. `September 2026`.
 *
 * @param date - Any date in the month.
 * @returns The month name and year.
 */
export function formatMonthLabel(date: Date): string {
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/**
 * Formats a month compactly for a chart axis, e.g. `Sep 2026`.
 *
 * @param date - Any date in the month.
 * @returns The abbreviated month and year.
 */
export function formatMonthShort(date: Date): string {
  return `${SHORT_MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/**
 * Formats a day for a dense list, e.g. `Sep 22`.
 *
 * @param date - The date to format.
 * @returns The abbreviated month and day.
 */
export function formatDayShort(date: Date): string {
  return `${SHORT_MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/**
 * Formats a date in full, e.g. `22 September 2026`.
 *
 * @param date - The date to format.
 * @returns The day, month name and year.
 */
export function formatDateLong(date: Date): string {
  return `${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/**
 * Compares two dates by month, ignoring the day.
 *
 * @param a - First date.
 * @param b - Second date.
 * @returns True when both fall in the same calendar month.
 */
export function isSameMonth(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
}

/**
 * Lists every month in an inclusive range.
 *
 * @param from - First month.
 * @param to - Last month, inclusive.
 * @returns The months in order, or an empty array when the range is inverted.
 */
export function monthRange(from: Date, to: Date): Date[] {
  const months: Date[] = [];
  const last = monthStart(to);
  let cursor = monthStart(from);

  // The guard stops a malformed range from looping forever.
  let guard = 0;
  while (cursor.getTime() <= last.getTime() && guard < 1200) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
    guard += 1;
  }

  return months;
}

/**
 * Determines which quarter a month falls in.
 *
 * @param date - Any date in the month.
 * @returns The quarter, 1 to 4.
 */
export function quarterOf(date: Date): number {
  return Math.floor(date.getUTCMonth() / 3) + 1;
}

/**
 * Finds the first month of the year containing a date.
 *
 * @param date - Any date in the year.
 * @returns UTC midnight on 1 January of that year.
 */
export function yearStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

/**
 * Finds the first month of the quarter containing a date.
 *
 * @param date - Any date in the quarter.
 * @returns UTC midnight on the 1st of the quarter's first month.
 */
export function quarterStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), (quarterOf(date) - 1) * 3, 1));
}

/**
 * Counts the days in a month, accounting for leap years.
 *
 * @param date - Any date in the month.
 * @returns The number of days.
 */
export function daysInMonth(date: Date): number {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}
