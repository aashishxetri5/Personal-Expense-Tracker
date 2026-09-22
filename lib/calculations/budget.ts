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
  /** Unspent allocation rolled in from earlier months. 0 for normal lines. */
  carriedIn?: number;
};

export type BudgetLine = BudgetLineInput & {
  carriedIn: number;
  /** planned + carriedIn — what the line may actually spend this month. */
  available: number;
  /** available - actual. Negative means over budget. */
  remaining: number;
  /** Capped at 100 so the bar cannot overflow its track. */
  progress: number;
  /** Uncapped percentage, for the "115% used" style readout. */
  rawProgress: number;
  isOver: boolean;
  overBy: number;
};

export type BudgetTotals = {
  planned: number;
  actual: number;
  remaining: number;
  progress: number;
  rawProgress: number;
  overCount: number;
};

/**
 * Derives one budget line's progress, remaining amount and over-budget state.
 *
 * @param input - The category, its planned amount, actual spend and carry-in.
 * @returns The line with its derived figures.
 */
export function buildBudgetLine(input: BudgetLineInput): BudgetLine {
  const carriedIn = round2(input.carriedIn ?? 0);
  const planned = round2(input.planned);
  const actual = round2(input.actual);
  const available = round2(planned + carriedIn);
  const remaining = round2(available - actual);

  const rawProgress = available > 0 ? percent(actual, available) : actual > 0 ? 100 : 0;

  return {
    ...input,
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

/**
 * Sums a set of budget lines into the month's headline plan figures.
 *
 * @param lines - The lines to total.
 * @returns Planned and actual totals plus how many lines are over.
 */
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
 * Replays an allowance month by month. An allocation is a ceiling, not a quota,
 * so what is left rolls forward — and an overspend rolls forward as a negative.
 *
 * @param months - Months in order, ending at the one being viewed.
 * @param allocationFor - Planned amount for a given month.
 * @param spentFor - Actual spend for a given month.
 * @param monthKey - Serialises a month into the returned map's key.
 * @returns The amount carried *into* each month, keyed by month.
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
