import { round2 } from "@/lib/format";
import { clamp, percent } from "@/lib/utils";
import type { CategoryKind } from "@/lib/types";

export type BudgetLineInput = {
  categoryId: string;
  categoryName: string;
  kind: CategoryKind;
  color: string;
  icon: string;
  carryForward: boolean;
  planned: number;
  actual: number;
  /** Unspent allocation rolled in from previous months. 0 for normal lines. */
  carriedIn?: number;
};

export type BudgetLine = {
  categoryId: string;
  categoryName: string;
  kind: CategoryKind;
  color: string;
  icon: string;
  carryForward: boolean;
  planned: number;
  actual: number;
  carriedIn: number;
  /** planned + carriedIn — what the line can actually spend this month. */
  available: number;
  /** available - actual. Negative means over budget. */
  remaining: number;
  /** actual / available, capped at 100 for the bar; see `rawProgress`. */
  progress: number;
  rawProgress: number;
  isOver: boolean;
  overBy: number;
};

export function buildBudgetLine(input: BudgetLineInput): BudgetLine {
  const carriedIn = round2(input.carriedIn ?? 0);
  const planned = round2(input.planned);
  const actual = round2(input.actual);
  const available = round2(planned + carriedIn);
  const remaining = round2(available - actual);
  const rawProgress = available > 0 ? percent(actual, available) : actual > 0 ? 100 : 0;

  return {
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    kind: input.kind,
    color: input.color,
    icon: input.icon,
    carryForward: input.carryForward,
    planned,
    actual,
    carriedIn,
    available,
    remaining,
    progress: clamp(rawProgress, 0, 100),
    rawProgress: round2(rawProgress),
    isOver: remaining < 0,
    overBy: remaining < 0 ? round2(-remaining) : 0,
  };
}

export type BudgetTotals = {
  planned: number;
  actual: number;
  remaining: number;
  progress: number;
  rawProgress: number;
  overCount: number;
};

export function budgetTotals(lines: readonly BudgetLine[]): BudgetTotals {
  const planned = round2(lines.reduce((sum, line) => sum + line.planned, 0));
  const actual = round2(lines.reduce((sum, line) => sum + line.actual, 0));
  const rawProgress = planned > 0 ? percent(actual, planned) : actual > 0 ? 100 : 0;

  return {
    planned,
    actual,
    remaining: round2(planned - actual),
    progress: clamp(rawProgress, 0, 100),
    rawProgress: round2(rawProgress),
    overCount: lines.filter((line) => line.isOver).length,
  };
}

/**
 * Carry-forward balances for allocation-style categories (Lifestyle / Personal).
 *
 * An allocation is a ceiling, not a quota: whatever is left at month end stays
 * with the category. September allocates 4,000 and spends 1,500, so October
 * starts with 2,500 carried in on top of its own 4,000.
 *
 * Overspending carries forward too, as a negative — the money came from
 * somewhere, and pretending otherwise would silently inflate next month.
 *
 * @param months          Month starts in chronological order, ending at the month being viewed.
 * @param allocationFor   Planned amount for the category in a given month.
 * @param spentFor        Actual spend for the category in a given month.
 * @returns               Amount carried *into* each month, keyed by month key.
 */
export function carryForwardByMonth(
  months: readonly Date[],
  allocationFor: (month: Date) => number,
  spentFor: (month: Date) => number,
  monthKey: (month: Date) => string,
): Map<string, number> {
  const carried = new Map<string, number>();
  let balance = 0;

  for (const month of months) {
    carried.set(monthKey(month), round2(balance));
    balance = round2(balance + allocationFor(month) - spentFor(month));
  }

  return carried;
}

/**
 * Carried-in balance for a single month — the value the Budget and Dashboard
 * screens need. Equivalent to the last entry of `carryForwardByMonth`.
 */
export function carriedInFor(
  months: readonly Date[],
  target: Date,
  allocationFor: (month: Date) => number,
  spentFor: (month: Date) => number,
  monthKey: (month: Date) => string,
): number {
  const map = carryForwardByMonth(months, allocationFor, spentFor, monthKey);
  return map.get(monthKey(target)) ?? 0;
}
