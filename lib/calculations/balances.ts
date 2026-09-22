import { round2 } from "@/lib/format";
import { clamp, percent } from "@/lib/utils";
import { classify } from "@/lib/calculations/ledger";
import type { LedgerEntry } from "@/lib/types";

/**
 * Running balances for sinking funds, savings goals and investments.
 *
 * All three are derived from the transaction ledger rather than stored as
 * mutable counters, so a fund balance can never disagree with the transactions
 * that produced it. Each accepts the transactions *up to and including* the
 * month being viewed, which is what makes historical browsing truthful: looking
 * at August shows the fund as it stood in August.
 */

export type FundMovement = { contributions: number; withdrawals: number };

/** Contributions in / spending out, per fund id. */
export function fundMovements(entries: readonly LedgerEntry[]): Map<string, FundMovement> {
  const movements = new Map<string, FundMovement>();

  for (const entry of entries) {
    if (!entry.futureFundId) continue;
    const bucket = classify(entry);
    const current = movements.get(entry.futureFundId) ?? { contributions: 0, withdrawals: 0 };

    if (bucket === "fundContribution") current.contributions = round2(current.contributions + entry.amount);
    else if (bucket === "fundExpense") current.withdrawals = round2(current.withdrawals + entry.amount);

    movements.set(entry.futureFundId, current);
  }

  return movements;
}

/** Contributions in / withdrawals out, per savings goal id. */
export function goalMovements(entries: readonly LedgerEntry[]): Map<string, FundMovement> {
  const movements = new Map<string, FundMovement>();

  for (const entry of entries) {
    if (!entry.savingsGoalId) continue;
    const bucket = classify(entry);
    const current = movements.get(entry.savingsGoalId) ?? { contributions: 0, withdrawals: 0 };

    if (bucket === "goalContribution") current.contributions = round2(current.contributions + entry.amount);
    else if (bucket === "goalWithdrawal") current.withdrawals = round2(current.withdrawals + entry.amount);

    movements.set(entry.savingsGoalId, current);
  }

  return movements;
}

/** Total invested per investment id. */
export function investmentTotals(entries: readonly LedgerEntry[]): Map<string, number> {
  const totals = new Map<string, number>();

  for (const entry of entries) {
    if (!entry.investmentId || entry.type !== "INVESTMENT") continue;
    totals.set(entry.investmentId, round2((totals.get(entry.investmentId) ?? 0) + entry.amount));
  }

  return totals;
}

export function balanceOf(openingBalance: number, movement: FundMovement | undefined): number {
  if (!movement) return round2(openingBalance);
  return round2(openingBalance + movement.contributions - movement.withdrawals);
}

export function progressOf(current: number, target: number): number {
  if (target <= 0) return current > 0 ? 100 : 0;
  return clamp(round2(percent(current, target)), 0, 100);
}

/**
 * Whole months of contributions still needed to reach a goal.
 * Returns null when the goal is already met or has no monthly plan.
 */
export function monthsToTarget(current: number, target: number, monthly: number): number | null {
  if (target <= 0 || current >= target) return null;
  if (monthly <= 0) return null;
  return Math.ceil((target - current) / monthly);
}

export type NetWorthTotals = { assets: number; liabilities: number; netWorth: number };

export function netWorthTotals(
  entries: readonly { kind: "ASSET" | "LIABILITY"; amount: number }[],
): NetWorthTotals {
  let assets = 0;
  let liabilities = 0;

  for (const entry of entries) {
    if (entry.kind === "ASSET") assets += entry.amount;
    else liabilities += entry.amount;
  }

  return {
    assets: round2(assets),
    liabilities: round2(liabilities),
    netWorth: round2(assets - liabilities),
  };
}
