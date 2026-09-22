/**
 * Money and number formatting. The currency code is a user setting rather than
 * a constant, so nothing here is welded to NPR.
 */

export const DEFAULT_CURRENCY = "NPR";
export const DEFAULT_LOCALE = "en-NP";

export type FormatOptions = {
  currency?: string;
  locale?: string;
  /** Force two decimals even on a whole amount. */
  decimals?: boolean;
  /** Prefix positive values with "+". */
  signed?: boolean;
};

/**
 * Resolves a locale the runtime can actually group numbers with.
 *
 * @param locale - The requested BCP 47 locale.
 * @returns The locale, or en-IN when the ICU build does not ship it.
 */
function groupingLocale(locale: string): string {
  // en-NP is missing from many ICU builds; en-IN groups identically.
  try {
    return new Intl.NumberFormat(locale).resolvedOptions().locale ? locale : "en-IN";
  } catch {
    return "en-IN";
  }
}

/**
 * Formats a grouped number with no currency code, e.g. `24,000`.
 *
 * @param value - The amount to format.
 * @param options - Locale and decimal preferences.
 * @returns The grouped number.
 */
export function formatNumber(value: number, options: FormatOptions = {}): string {
  const { locale = DEFAULT_LOCALE, decimals = false } = options;
  const fractionDigits = decimals || !Number.isInteger(value) ? 2 : 0;

  return new Intl.NumberFormat(groupingLocale(locale), {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/**
 * Formats an amount as `NPR 24,000` — the canonical money rendering.
 *
 * @param value - The amount to format.
 * @param options - Currency, locale, decimals and sign preferences.
 * @returns The formatted money string.
 */
export function formatCurrency(value: number, options: FormatOptions = {}): string {
  const { currency = DEFAULT_CURRENCY, signed = false } = options;
  const body = `${currency} ${formatNumber(Math.abs(value), options)}`;

  if (value < 0) return `-${body}`;
  if (signed && value > 0) return `+${body}`;
  return body;
}

/**
 * Shortens a value for a chart axis, e.g. `24.0K` or `2.4L`.
 *
 * @param value - The amount to abbreviate.
 * @returns A compact label using K / L / Cr scales.
 */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1_00_00_000) {
    return `${sign}${(abs / 1_00_00_000).toFixed(abs >= 1_00_00_00_000 ? 0 : 1)}Cr`;
  }
  if (abs >= 1_00_000) return `${sign}${(abs / 1_00_000).toFixed(abs >= 10_00_000 ? 0 : 1)}L`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return `${sign}${abs}`;
}

/**
 * Formats a percentage for display, e.g. `91.7%`.
 *
 * @param value - The percentage value (already scaled to 0-100).
 * @param fractionDigits - Decimal places to show. Defaults to 1.
 * @returns The formatted percentage, or an em dash when not finite.
 */
export function formatPercent(value: number, fractionDigits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(fractionDigits)}%`;
}

/**
 * Converts a Prisma `Decimal` (or anything numeric) into a plain number.
 *
 * @param value - The value to coerce.
 * @returns A finite number, or 0 when the value cannot be parsed.
 */
export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;

  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Rounds to two decimal places, avoiding float dust like 0.30000000000000004.
 *
 * @param value - The number to round.
 * @returns The value rounded to two decimals.
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Parses a money field typed by a person, tolerating thousands separators.
 *
 * @param value - The raw input text.
 * @param options - `allowNegative` keeps a minus sign; otherwise negatives are 0.
 * @returns The rounded amount, or 0 when the text is not a number.
 */
export function parseAmountInput(
  value: string,
  options: { allowNegative?: boolean } = {},
): number {
  const parsed = Number(value.replace(/,/g, "").trim());
  if (!Number.isFinite(parsed)) return 0;
  if (!options.allowNegative && parsed <= 0) return 0;
  return round2(parsed);
}
