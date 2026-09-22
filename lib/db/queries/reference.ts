import { cache } from "react";

import { prisma } from "@/lib/db/prisma";
import { dateKeyOrNull } from "@/lib/db/queries/shared";
import { toNumber } from "@/lib/format";
import type { AccountDTO, CategoryDTO, FutureFundDTO, InvestmentDTO, SavingsGoalDTO } from "@/lib/types";

/**
 * Reference data (categories, accounts, funds, goals, investments).
 *
 * Nearly every screen and every form needs these lists, so they are fetched
 * once per render pass via React `cache` rather than re-queried per component.
 */

export const getCategories = cache(async (userId: string): Promise<CategoryDTO[]> => {
  const rows = await prisma.category.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    color: row.color,
    icon: row.icon,
    carryForward: row.carryForward,
    isSystem: row.isSystem,
    sortOrder: row.sortOrder,
    archived: row.archivedAt !== null,
    futureFundId: row.futureFundId,
  }));
});

export const getAccounts = cache(async (userId: string): Promise<AccountDTO[]> => {
  const rows = await prisma.account.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    openingBalance: toNumber(row.openingBalance),
    sortOrder: row.sortOrder,
    archived: row.archivedAt !== null,
  }));
});

export const getFutureFunds = cache(async (userId: string): Promise<FutureFundDTO[]> => {
  const rows = await prisma.futureFund.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { category: { select: { id: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    targetAmount: toNumber(row.targetAmount),
    monthlyContribution: toNumber(row.monthlyContribution),
    openingBalance: toNumber(row.openingBalance),
    nextExpenseLabel: row.nextExpenseLabel,
    nextDueDate: dateKeyOrNull(row.nextDueDate),
    color: row.color,
    icon: row.icon,
    archived: row.archivedAt !== null,
    categoryId: row.category?.id ?? null,
  }));
});

export const getSavingsGoals = cache(async (userId: string): Promise<SavingsGoalDTO[]> => {
  const rows = await prisma.savingsGoal.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    targetAmount: toNumber(row.targetAmount),
    openingBalance: toNumber(row.openingBalance),
    monthlyContribution: toNumber(row.monthlyContribution),
    targetDate: dateKeyOrNull(row.targetDate),
    notes: row.notes,
    color: row.color,
    icon: row.icon,
    archived: row.archivedAt !== null,
  }));
});

export const getInvestments = cache(async (userId: string): Promise<InvestmentDTO[]> => {
  const rows = await prisma.investment.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    provider: row.provider,
    monthlyContribution: toNumber(row.monthlyContribution),
    openingBalance: toNumber(row.openingBalance),
    notes: row.notes,
    color: row.color,
    archived: row.archivedAt !== null,
  }));
});

/** Everything the Add Transaction form needs, in one round trip. */
export const getFormOptions = cache(async (userId: string) => {
  const [categories, accounts, futureFunds, savingsGoals, investments] = await Promise.all([
    getCategories(userId),
    getAccounts(userId),
    getFutureFunds(userId),
    getSavingsGoals(userId),
    getInvestments(userId),
  ]);

  return {
    categories: categories.filter((c) => !c.archived),
    accounts: accounts.filter((a) => !a.archived),
    futureFunds: futureFunds.filter((f) => !f.archived),
    savingsGoals: savingsGoals.filter((g) => !g.archived),
    investments: investments.filter((i) => !i.archived),
  };
});

export type FormOptions = Awaited<ReturnType<typeof getFormOptions>>;
