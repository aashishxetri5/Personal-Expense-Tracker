import { cache } from "react";

import {
  balanceOf,
  fundMovements,
  goalMovements,
  investmentTotals,
  monthsToTarget,
  progressOf,
} from "@/lib/calculations/balances";
import { buildBudgetLine, budgetTotals, carryForwardByMonth, type BudgetLine } from "@/lib/calculations/budget";
import { categoryActuals, summarise, type MonthlySummary } from "@/lib/calculations/ledger";
import { prisma } from "@/lib/db/prisma";
import {
  getCategories,
  getFutureFunds,
  getInvestments,
  getSavingsGoals,
} from "@/lib/db/queries/reference";
import { ledgerForMonth } from "@/lib/db/queries/shared";
import { round2, toNumber } from "@/lib/format";
import { monthEnd, monthRange, monthStart, toMonthKey, yearStart } from "@/lib/month";
import type {
  CategoryDTO,
  FutureFundWithBalance,
  InvestmentWithTotals,
  SavingsGoalWithProgress,
} from "@/lib/types";

export type CategorySpendRow = {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  kind: CategoryDTO["kind"];
  amount: number;
  share: number;
};

export type MonthSnapshot = {
  monthKey: string;
  summary: MonthlySummary;
  budget: {
    exists: boolean;
    id: string | null;
    incomeTarget: number;
    note: string | null;
    lines: BudgetLine[];
    totals: ReturnType<typeof budgetTotals>;
  };
  spendByCategory: CategorySpendRow[];
  funds: FutureFundWithBalance[];
  goals: SavingsGoalWithProgress[];
  investments: InvestmentWithTotals[];
  emergencyFund: SavingsGoalWithProgress | null;
  /** The carry-forward allocation line (Lifestyle / Personal by default). */
  carryForwardLines: BudgetLine[];
};

/**
 * Balances as they stood at the end of a month, aggregated in the database so
 * browsing an old month does not pull every transaction since over the wire.
 *
 * @param userId - Owner of the records.
 * @param month - The month being viewed; balances are taken at its end.
 * @returns Fund, goal and investment totals keyed by id.
 */
async function balancesThroughMonth(userId: string, month: Date) {
  const before = { lt: monthEnd(month) };

  const [fundRows, goalRows, investmentRows, investedThisYearRows] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["futureFundId", "type"],
      where: { userId, date: before, futureFundId: { not: null } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["savingsGoalId", "type"],
      where: { userId, date: before, savingsGoalId: { not: null } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["investmentId"],
      where: { userId, date: before, type: "INVESTMENT", investmentId: { not: null } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["investmentId"],
      where: {
        userId,
        type: "INVESTMENT",
        investmentId: { not: null },
        date: { gte: yearStart(month), lt: monthEnd(month) },
      },
      _sum: { amount: true },
    }),
  ]);

  const funds = new Map<string, { contributions: number; withdrawals: number }>();
  for (const row of fundRows) {
    if (!row.futureFundId) continue;
    const entry = funds.get(row.futureFundId) ?? { contributions: 0, withdrawals: 0 };
    const amount = toNumber(row._sum.amount);
    if (row.type === "TRANSFER") entry.contributions = round2(entry.contributions + amount);
    if (row.type === "EXPENSE") entry.withdrawals = round2(entry.withdrawals + amount);
    funds.set(row.futureFundId, entry);
  }

  const goals = new Map<string, { contributions: number; withdrawals: number }>();
  for (const row of goalRows) {
    if (!row.savingsGoalId) continue;
    const entry = goals.get(row.savingsGoalId) ?? { contributions: 0, withdrawals: 0 };
    const amount = toNumber(row._sum.amount);
    if (row.type === "TRANSFER") entry.contributions = round2(entry.contributions + amount);
    if (row.type === "EXPENSE") entry.withdrawals = round2(entry.withdrawals + amount);
    goals.set(row.savingsGoalId, entry);
  }

  const invested = new Map<string, number>();
  for (const row of investmentRows) {
    if (!row.investmentId) continue;
    invested.set(row.investmentId, toNumber(row._sum.amount));
  }

  const investedThisYear = new Map<string, number>();
  for (const row of investedThisYearRows) {
    if (!row.investmentId) continue;
    investedThisYear.set(row.investmentId, toNumber(row._sum.amount));
  }

  return { funds, goals, invested, investedThisYear };
}

/**
 * Replays every month up to the one being viewed, so a rollover is recomputed
 * from history rather than stored — fixing a past month corrects the rest.
 *
 * @param userId - Owner of the records.
 * @param month - The month being viewed.
 * @param categories - All categories; only carry-forward ones are replayed.
 * @returns Amount carried into the viewed month, per category id.
 */
async function carryForwardBalances(
  userId: string,
  month: Date,
  categories: CategoryDTO[],
): Promise<Map<string, number>> {
  const carryCategories = categories.filter((category) => category.carryForward);
  const result = new Map<string, number>();
  if (carryCategories.length === 0) return result;

  const categoryIds = carryCategories.map((category) => category.id);
  const upperBound = monthEnd(month);

  const [items, spend, firstBudget, firstTxn] = await Promise.all([
    prisma.budgetItem.findMany({
      where: {
        categoryId: { in: categoryIds },
        monthlyBudget: { userId, month: { lt: upperBound } },
      },
      select: { categoryId: true, plannedAmount: true, monthlyBudget: { select: { month: true } } },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        categoryId: { in: categoryIds },
        type: "EXPENSE",
        futureFundId: null,
        savingsGoalId: null,
        date: { lt: upperBound },
      },
      select: { categoryId: true, amount: true, date: true },
    }),
    prisma.monthlyBudget.findFirst({ where: { userId }, orderBy: { month: "asc" }, select: { month: true } }),
    prisma.transaction.findFirst({
      where: { userId, categoryId: { in: categoryIds } },
      orderBy: { date: "asc" },
      select: { date: true },
    }),
  ]);

  const candidates = [firstBudget?.month, firstTxn?.date].filter(Boolean) as Date[];
  if (candidates.length === 0) {
    for (const category of carryCategories) result.set(category.id, 0);
    return result;
  }

  const start = monthStart(new Date(Math.min(...candidates.map((d) => d.getTime()))));
  const months = monthRange(start, month);

  const allocationIndex = new Map<string, number>();
  for (const item of items) {
    const key = `${item.categoryId}:${toMonthKey(item.monthlyBudget.month)}`;
    allocationIndex.set(key, round2((allocationIndex.get(key) ?? 0) + toNumber(item.plannedAmount)));
  }

  const spendIndex = new Map<string, number>();
  for (const row of spend) {
    if (!row.categoryId) continue;
    const key = `${row.categoryId}:${toMonthKey(row.date)}`;
    spendIndex.set(key, round2((spendIndex.get(key) ?? 0) + toNumber(row.amount)));
  }

  for (const category of carryCategories) {
    const carried = carryForwardByMonth(
      months,
      (m) => allocationIndex.get(`${category.id}:${toMonthKey(m)}`) ?? 0,
      (m) => spendIndex.get(`${category.id}:${toMonthKey(m)}`) ?? 0,
      toMonthKey,
    );
    result.set(category.id, carried.get(toMonthKey(month)) ?? 0);
  }

  return result;
}

/** Everything the Dashboard, Budget and Spending views read from. */
/**
 * Gathers everything the Dashboard, Budget and Spending views read for a month.
 * Uncached, so scripts outside a React render can call it directly.
 *
 * @param userId - Owner of the records.
 * @param month - The month to summarise.
 * @returns The month's summary, budget, balances and category breakdown.
 */
export async function loadMonthSnapshot(userId: string, month: Date): Promise<MonthSnapshot> {
  const [entries, budgetRecord, categories, funds, goals, investments, balances] = await Promise.all([
    ledgerForMonth(userId, month),
    prisma.monthlyBudget.findUnique({
      where: { userId_month: { userId, month: monthStart(month) } },
      include: { items: true },
    }),
    getCategories(userId),
    getFutureFunds(userId),
    getSavingsGoals(userId),
    getInvestments(userId),
    balancesThroughMonth(userId, month),
  ]);

  const carriedIn = await carryForwardBalances(userId, month, categories);

  const summary = summarise(entries);
  const actuals = categoryActuals(entries);
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  // Budget lines: every budgeted category, plus any category with real activity
  // this month so nothing is spent silently off-budget.
  const plannedByCategory = new Map<string, number>();
  for (const item of budgetRecord?.items ?? []) {
    plannedByCategory.set(item.categoryId, toNumber(item.plannedAmount));
  }

  const lineCategoryIds = new Set<string>([...plannedByCategory.keys()]);
  for (const [categoryId, amount] of actuals) {
    if (amount !== 0) lineCategoryIds.add(categoryId);
  }
  for (const category of categories) {
    if (category.carryForward && !category.archived) lineCategoryIds.add(category.id);
  }

  const lines = [...lineCategoryIds]
    .map((categoryId) => {
      const category = categoryById.get(categoryId);
      if (!category || category.kind === "INCOME") return null;
      return buildBudgetLine({
        categoryId,
        categoryName: category.name,
        kind: category.kind,
        color: category.color,
        icon: category.icon,
        carryForward: category.carryForward,
        planned: plannedByCategory.get(categoryId) ?? 0,
        actual: actuals.get(categoryId) ?? 0,
        carriedIn: category.carryForward ? (carriedIn.get(categoryId) ?? 0) : 0,
      });
    })
    .filter((line): line is BudgetLine => line !== null)
    .sort((a, b) => {
      const orderA = categoryById.get(a.categoryId)?.sortOrder ?? 0;
      const orderB = categoryById.get(b.categoryId)?.sortOrder ?? 0;
      return orderA - orderB || a.categoryName.localeCompare(b.categoryName);
    });

  const spendTotal = lines.reduce((sum, line) => sum + line.actual, 0);
  const spendByCategory: CategorySpendRow[] = lines
    .filter((line) => line.actual > 0)
    .map((line) => ({
      categoryId: line.categoryId,
      name: line.categoryName,
      color: line.color,
      icon: line.icon,
      kind: line.kind,
      amount: line.actual,
      share: spendTotal > 0 ? round2((line.actual / spendTotal) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const monthFundMovements = fundMovements(entries);
  const monthGoalMovements = goalMovements(entries);
  const monthInvestments = investmentTotals(entries);

  const fundsWithBalance: FutureFundWithBalance[] = funds.map((fund) => {
    const balance = balanceOf(fund.openingBalance, balances.funds.get(fund.id));
    const movement = monthFundMovements.get(fund.id);
    return {
      ...fund,
      balance,
      contributedThisMonth: movement?.contributions ?? 0,
      spentThisMonth: movement?.withdrawals ?? 0,
      progress: progressOf(balance, fund.targetAmount),
    };
  });

  const goalsWithProgress: SavingsGoalWithProgress[] = goals.map((goal) => {
    const current = balanceOf(goal.openingBalance, balances.goals.get(goal.id));
    const movement = monthGoalMovements.get(goal.id);
    return {
      ...goal,
      current,
      contributedThisMonth: movement?.contributions ?? 0,
      progress: progressOf(current, goal.targetAmount),
      monthsRemaining: monthsToTarget(current, goal.targetAmount, goal.monthlyContribution),
    };
  });

  const investmentsWithTotals: InvestmentWithTotals[] = investments.map((investment) => ({
    ...investment,
    totalInvested: round2(investment.openingBalance + (balances.invested.get(investment.id) ?? 0)),
    investedThisMonth: monthInvestments.get(investment.id) ?? 0,
    investedThisYear: balances.investedThisYear.get(investment.id) ?? 0,
  }));

  return {
    monthKey: toMonthKey(month),
    summary,
    budget: {
      exists: budgetRecord !== null,
      id: budgetRecord?.id ?? null,
      incomeTarget: toNumber(budgetRecord?.incomeTarget ?? 0),
      note: budgetRecord?.note ?? null,
      lines,
      totals: budgetTotals(lines),
    },
    spendByCategory,
    funds: fundsWithBalance,
    goals: goalsWithProgress,
    investments: investmentsWithTotals,
    emergencyFund: goalsWithProgress.find((goal) => goal.kind === "EMERGENCY" && !goal.archived) ?? null,
    carryForwardLines: lines.filter((line) => line.carryForward),
  };
}

/**
 * The month snapshot, memoised for one server render so sibling components do
 * not each re-run the same aggregation.
 *
 * @param userId - Owner of the records.
 * @param month - The month to summarise.
 * @returns The month's summary, budget, balances and category breakdown.
 */
export const getMonthSnapshot = cache(loadMonthSnapshot);
