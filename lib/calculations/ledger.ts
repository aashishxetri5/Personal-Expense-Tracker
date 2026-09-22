import { round2 } from "@/lib/format";
import type { LedgerEntry } from "@/lib/types";

/**
 * Where a transaction lands in the month's accounting. A transaction belongs to
 * exactly one bucket, and every headline figure is a sum of buckets rather than
 * a sum of rows — which is what stops a rupee being counted twice.
 */
export type LedgerBucket =
  | "income"
  | "expense"
  | "fundExpense"
  | "goalWithdrawal"
  | "fundContribution"
  | "goalContribution"
  | "investment"
  | "accountTransfer";

export type MonthlySummary = {
  income: number;
  /** Everyday spending charged to this month's budget. */
  expenses: number;
  fundContributions: number;
  goalContributions: number;
  investments: number;
  /** Spending paid out of a sinking fund. Shown, but not charged again. */
  fundExpenses: number;
  /** Spending paid out of a savings goal. Shown, but not charged again. */
  goalWithdrawals: number;
  /** Movement between accounts. Excluded from every total. */
  accountTransfers: number;
  /** Headline "Spent": everyday spending plus money earmarked into funds. */
  spent: number;
  /** Everything income was assigned to: spent + invested + saved. */
  allocated: number;
  /** Income not yet assigned. Negative when over-allocated. */
  remaining: number;
  /** Deliberate savings — goal and emergency-fund contributions. */
  saved: number;
  /** Total that left the wallet, reserve spending included. */
  totalOutflow: number;
  /** (saved + remaining) / income, the conventional savings rate. */
  savingsRate: number;
  transactionCount: number;
};

/**
 * Decides which bucket a transaction belongs to.
 *
 * @param entry - The transaction's type and its fund/goal links.
 * @returns The single bucket the transaction counts towards.
 */
export function classify(
  entry: Pick<LedgerEntry, "type" | "futureFundId" | "savingsGoalId">,
): LedgerBucket {
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
 * Decides whether a bucket consumes part of the month's budget. Spending out of
 * a reserve does not — that money was charged when it was set aside.
 *
 * @param bucket - The bucket to test.
 * @returns True when the amount counts against this month's plan.
 */
export function countsAgainstBudget(bucket: LedgerBucket): boolean {
  return bucket === "expense" || bucket === "fundContribution";
}

/**
 * Folds a month's transactions into the summary every screen reads from.
 *
 * @param entries - The transactions falling inside the month.
 * @returns Totals per bucket plus the derived headline figures.
 */
export function summarise(entries: readonly LedgerEntry[]): MonthlySummary {
  const totals: Record<LedgerBucket, number> = {
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
  const saved = round2(totals.goalContribution);
  const investments = round2(totals.investment);

  const spent = round2(expenses + fundContributions);
  const allocated = round2(spent + investments + saved);
  const remaining = round2(income - allocated);

  return {
    income,
    expenses,
    fundContributions,
    goalContributions: saved,
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
 * Totals spending per category for budget comparison. Reserve-financed spending
 * is excluded so a fund's category is not charged twice.
 *
 * @param entries - The transactions falling inside the month.
 * @returns Amount spent per category id.
 */
export function categoryActuals(entries: readonly LedgerEntry[]): Map<string, number> {
  const totals = new Map<string, number>();

  for (const entry of entries) {
    if (!entry.categoryId) continue;

    const bucket = classify(entry);
    const excluded =
      bucket === "income" ||
      bucket === "accountTransfer" ||
      bucket === "fundExpense" ||
      bucket === "goalWithdrawal";
    if (excluded) continue;

    totals.set(entry.categoryId, round2((totals.get(entry.categoryId) ?? 0) + entry.amount));
  }

  return totals;
}
