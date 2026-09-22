import { round2 } from "@/lib/format";
import type { LedgerEntry } from "@/lib/types";

/**
 * Where a transaction lands in the month's accounting.
 *
 * The whole point of this module is that a rupee is counted **once**. A
 * transaction is classified into exactly one bucket, and every headline figure
 * is a sum of buckets — never a sum of raw rows.
 */
export type LedgerBucket =
  /** Money in. */
  | "income"
  /** Everyday spending, charged to this month's budget. */
  | "expense"
  /** Spending financed by a sinking fund — already paid for when contributed. */
  | "fundExpense"
  /** Spending financed by a savings goal (e.g. finally buying the laptop). */
  | "goalWithdrawal"
  /** Money earmarked into a sinking fund. */
  | "fundContribution"
  /** Money moved into a savings goal / emergency fund. */
  | "goalContribution"
  /** Money moved into an investment. */
  | "investment"
  /** Cash moved between accounts. Neutral: never counted anywhere. */
  | "accountTransfer";

export function classify(entry: Pick<LedgerEntry, "type" | "futureFundId" | "savingsGoalId">): LedgerBucket {
  switch (entry.type) {
    case "INCOME":
      return "income";
    case "INVESTMENT":
      return "investment";
    case "EXPENSE":
      if (entry.futureFundId) return "fundExpense";
      if (entry.savingsGoalId) return "goalWithdrawal";
      return "expense";
    case "TRANSFER":
      if (entry.futureFundId) return "fundContribution";
      if (entry.savingsGoalId) return "goalContribution";
      return "accountTransfer";
  }
}

/**
 * Does this transaction consume part of the month's budget?
 *
 * Contributions to funds/goals do (you set the money aside this month).
 * Spending *out of* a fund or goal does not — that money was already accounted
 * for when it was set aside, so charging it again would double-count.
 */
export function countsAgainstBudget(bucket: LedgerBucket): boolean {
  return bucket === "expense" || bucket === "fundContribution";
}

export type MonthlySummary = {
  /** Sum of INCOME. */
  income: number;
  /** Everyday spending that hits this month's budget. */
  expenses: number;
  /** Earmarked into sinking funds this month. */
  fundContributions: number;
  /** Moved into savings goals / emergency fund this month. */
  goalContributions: number;
  /** Moved into investments this month. */
  investments: number;
  /** Spending paid out of a sinking fund. Shown, but not charged again. */
  fundExpenses: number;
  /** Spending paid out of a savings goal. Shown, but not charged again. */
  goalWithdrawals: number;
  /** Pure account-to-account movement. Excluded from every total. */
  accountTransfers: number;

  /** Headline "Spent": everyday spending + money earmarked into funds. */
  spent: number;
  /** Everything income was assigned to: spent + invested + saved. */
  allocated: number;
  /** Income not yet assigned to anything. Can be negative. */
  remaining: number;
  /** Deliberate savings — goal + emergency-fund contributions. */
  saved: number;
  /** Total money that actually left the wallet, reserves included. */
  totalOutflow: number;
  /** (saved + remaining) / income, the conventional savings rate. */
  savingsRate: number;
  transactionCount: number;
};

export const EMPTY_SUMMARY: MonthlySummary = {
  income: 0,
  expenses: 0,
  fundContributions: 0,
  goalContributions: 0,
  investments: 0,
  fundExpenses: 0,
  goalWithdrawals: 0,
  accountTransfers: 0,
  spent: 0,
  allocated: 0,
  remaining: 0,
  saved: 0,
  totalOutflow: 0,
  savingsRate: 0,
  transactionCount: 0,
};

/** Fold a set of transactions into the one summary every screen reads from. */
export function summarise(entries: readonly LedgerEntry[]): MonthlySummary {
  const totals = {
    income: 0,
    expense: 0,
    fundExpense: 0,
    goalWithdrawal: 0,
    fundContribution: 0,
    goalContribution: 0,
    investment: 0,
    accountTransfer: 0,
  };

  for (const entry of entries) {
    totals[classify(entry)] += entry.amount;
  }

  const income = round2(totals.income);
  const expenses = round2(totals.expense);
  const fundContributions = round2(totals.fundContribution);
  const goalContributions = round2(totals.goalContribution);
  const investments = round2(totals.investment);

  const spent = round2(expenses + fundContributions);
  const saved = goalContributions;
  const allocated = round2(spent + investments + saved);
  const remaining = round2(income - allocated);

  return {
    income,
    expenses,
    fundContributions,
    goalContributions,
    investments,
    fundExpenses: round2(totals.fundExpense),
    goalWithdrawals: round2(totals.goalWithdrawal),
    accountTransfers: round2(totals.accountTransfer),
    spent,
    allocated,
    remaining,
    saved,
    totalOutflow: round2(allocated + totals.fundExpense + totals.goalWithdrawal),
    savingsRate: income > 0 ? round2(((saved + remaining) / income) * 100) : 0,
    transactionCount: entries.length,
  };
}

/**
 * Per-category actuals for budget comparison.
 *
 * Reserve-financed spending is excluded for the same no-double-counting reason
 * as above: the Vehicle category was already charged when the NPR 900 was set
 * aside, so the NPR 2,500 servicing bill must not be charged to it again.
 */
export function categoryActuals(entries: readonly LedgerEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.categoryId) continue;
    const bucket = classify(entry);
    if (bucket === "income" || bucket === "accountTransfer") continue;
    if (bucket === "fundExpense" || bucket === "goalWithdrawal") continue;
    totals.set(entry.categoryId, round2((totals.get(entry.categoryId) ?? 0) + entry.amount));
  }
  return totals;
}

/** Income received per income category — kept separate from spending. */
export function incomeActuals(entries: readonly LedgerEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.categoryId || entry.type !== "INCOME") continue;
    totals.set(entry.categoryId, round2((totals.get(entry.categoryId) ?? 0) + entry.amount));
  }
  return totals;
}
