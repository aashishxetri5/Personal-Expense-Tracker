import { round2 } from "@/lib/format";
import { clamp, percent } from "@/lib/utils";
import { classify } from "@/lib/calculations/ledger";
import type { LedgerEntry } from "@/lib/types";

/**
 * Running balances for funds, goals and investments. All three are derived from
 * the transaction ledger rather than stored as counters, so a balance can never
 * disagree with the rows that produced it.
 */

export type FundMovement = { contributions: number; withdrawals: number };

export type NetWorthTotals = { assets: number; liabilities: number; netWorth: number };

/**
 * Tallies money in and out of each sinking fund.
 *
 * @param entries - Transactions up to and including the month being viewed.
 * @returns Contributions and withdrawals per fund id.
 */
export function fundMovements(entries: readonly LedgerEntry[]): Map<string, FundMovement> {
  const movements = new Map<string, FundMovement>();

  for (const entry of entries) {
    if (!entry.futureFundId) continue;

    const bucket = classify(entry);
    const current = movements.get(entry.futureFundId) ?? { contributions: 0, withdrawals: 0 };

    if (bucket === "fundContribution") {
      current.contributions = round2(current.contributions + entry.amount);
    } else if (bucket === "fundExpense") {
      current.withdrawals = round2(current.withdrawals + entry.amount);
    }

    movements.set(entry.futureFundId, current);
  }

  return movements;
}

/**
 * Tallies money in and out of each savings goal.
 *
 * @param entries - Transactions up to and including the month being viewed.
 * @returns Contributions and withdrawals per goal id.
 */
export function goalMovements(entries: readonly LedgerEntry[]): Map<string, FundMovement> {
  const movements = new Map<string, FundMovement>();

  for (const entry of entries) {
    if (!entry.savingsGoalId) continue;

    const bucket = classify(entry);
    const current = movements.get(entry.savingsGoalId) ?? { contributions: 0, withdrawals: 0 };

    if (bucket === "goalContribution") {
      current.contributions = round2(current.contributions + entry.amount);
    } else if (bucket === "goalWithdrawal") {
      current.withdrawals = round2(current.withdrawals + entry.amount);
    }

    movements.set(entry.savingsGoalId, current);
  }

  return movements;
}

/**
 * Totals contributions into each investment.
 *
 * @param entries - Transactions up to and including the month being viewed.
 * @returns Amount invested per investment id.
 */
export function investmentTotals(entries: readonly LedgerEntry[]): Map<string, number> {
  const totals = new Map<string, number>();

  for (const entry of entries) {
    if (!entry.investmentId || entry.type !== "INVESTMENT") continue;
    totals.set(entry.investmentId, round2((totals.get(entry.investmentId) ?? 0) + entry.amount));
  }

  return totals;
}

/**
 * Applies movements to the balance a fund or goal started with.
 *
 * @param openingBalance - Amount held before tracking began.
 * @param movement - Contributions and withdrawals, or undefined when untouched.
 * @returns The current balance.
 */
export function balanceOf(openingBalance: number, movement: FundMovement | undefined): number {
  if (!movement) return round2(openingBalance);
  return round2(openingBalance + movement.contributions - movement.withdrawals);
}

/**
 * Expresses a balance as progress towards a target.
 *
 * @param current - The amount held.
 * @param target - The goal amount; 0 means untargeted.
 * @returns A percentage from 0 to 100.
 */
export function progressOf(current: number, target: number): number {
  if (target <= 0) return current > 0 ? 100 : 0;
  return clamp(round2(percent(current, target)), 0, 100);
}

/**
 * Estimates how long a goal still needs at its planned contribution.
 *
 * @param current - The amount held.
 * @param target - The goal amount.
 * @param monthly - The planned monthly contribution.
 * @returns Whole months remaining, or null when already met or unknowable.
 */
export function monthsToTarget(current: number, target: number, monthly: number): number | null {
  if (target <= 0 || current >= target) return null;
  if (monthly <= 0) return null;
  return Math.ceil((target - current) / monthly);
}

/**
 * Sums a snapshot's entries into assets, liabilities and net worth.
 *
 * @param entries - The snapshot's asset and liability rows.
 * @returns The three totals; net worth may be negative.
 */
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
