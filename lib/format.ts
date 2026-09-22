/**
 * Money and number formatting.
 *
 * The currency code is a setting, not a constant — it is threaded through from
 * `UserSettings` so the app is not welded to NPR. `NPR 24,000` is rendered as a
 * code + grouped number rather than a symbol, which is how amounts are normally
 * written in Nepal.
 */

export const DEFAULT_CURRENCY = "NPR";
export const DEFAULT_LOCALE = "en-NP";

type FormatOptions = {
  currency?: string;
  locale?: string;
  /** Show decimals even when the amount is whole. Default: false. */
  decimals?: boolean;
  /** Prefix positive values with "+". Useful for signed ledgers. */
  signed?: boolean;
};

function groupingLocale(locale: string) {
  // en-NP is not universally available in Node/browser ICU builds; en-IN uses
  // the same lakh/crore grouping conventions and is far more widely shipped.
  try {
    return new Intl.NumberFormat(locale).resolvedOptions().locale ? locale : "en-IN";
  } catch {
    return "en-IN";
  }
}

/** `24,000` — a grouped number with no currency code. */
export function formatNumber(value: number, options: FormatOptions = {}): string {
  const { locale = DEFAULT_LOCALE, decimals = false } = options;
  const fractionDigits = decimals || !Number.isInteger(value) ? 2 : 0;
  return new Intl.NumberFormat(groupingLocale(locale), {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** `NPR 24,000` — the canonical money rendering used across the app. */
export function formatCurrency(value: number, options: FormatOptions = {}): string {
  const { currency = DEFAULT_CURRENCY, signed = false } = options;
  const magnitude = Math.abs(value);
  const body = `${currency} ${formatNumber(magnitude, options)}`;
  if (value < 0) return `-${body}`;
  if (signed && value > 0) return `+${body}`;
  return body;
}

/** `+24,000` / `-650` — for transaction rows where the code is shown elsewhere. */
export function formatSignedNumber(value: number, options: FormatOptions = {}): string {
  const body = formatNumber(Math.abs(value), options);
  if (value < 0) return `-${body}`;
  if (value > 0) return `+${body}`;
  return body;
}

/** `24.0K` / `2.4L` — compact axis labels that stay readable on mobile. */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_00_00_000) return `${sign}${(abs / 1_00_00_000).toFixed(abs >= 1_00_00_00_000 ? 0 : 1)}Cr`;
  if (abs >= 1_00_000) return `${sign}${(abs / 1_00_000).toFixed(abs >= 10_00_000 ? 0 : 1)}L`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return `${sign}${abs}`;
}

/** `91.7%` */
export function formatPercent(value: number, fractionDigits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(fractionDigits)}%`;
}

/** Turn a Prisma `Decimal` (or anything numeric) into a plain JS number. */
export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Round to 2 decimal places, avoiding float dust like 0.30000000000000004. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
