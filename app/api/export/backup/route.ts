import { jsonDownloadResponse } from "@/lib/csv";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/db/user";
import { toNumber } from "@/lib/format";
import { toDateKey, toMonthKey } from "@/lib/month";

export const dynamic = "force-dynamic";

/**
 * Builds a complete JSON backup. Amounts serialise as numbers and dates as
 * strings, so the file is readable without Prisma's Decimal type.
 *
 * @returns A JSON download containing every record the user owns.
 */
export async function GET() {
  const user = await getCurrentUser();

  const [
    settings,
    accounts,
    categories,
    futureFunds,
    savingsGoals,
    investments,
    budgets,
    snapshots,
    transactions,
  ] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId: user.id } }),
    prisma.account.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
    prisma.category.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
    prisma.futureFund.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
    prisma.savingsGoal.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
    prisma.investment.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
    prisma.monthlyBudget.findMany({
      where: { userId: user.id },
      orderBy: { month: "asc" },
      include: { items: { include: { category: { select: { name: true } } } } },
    }),
    prisma.netWorthSnapshot.findMany({
      where: { userId: user.id },
      orderBy: { month: "asc" },
      include: { entries: true },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
      include: {
        category: { select: { name: true } },
        account: { select: { name: true } },
        transferAccount: { select: { name: true } },
        futureFund: { select: { name: true } },
        savingsGoal: { select: { name: true } },
        investment: { select: { name: true } },
      },
    }),
  ]);

  return jsonDownloadResponse(`finance-backup-${toDateKey(new Date())}.json`, {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: {
      name: user.name,
      currency: settings?.currency ?? user.currency,
      locale: settings?.locale ?? user.locale,
      defaultMonthlyIncome: toNumber(settings?.defaultMonthlyIncome ?? 0),
    },
    accounts: accounts.map((row) => ({
      name: row.name,
      kind: row.kind,
      openingBalance: toNumber(row.openingBalance),
      archived: row.archivedAt !== null,
    })),
    categories: categories.map((row) => ({
      name: row.name,
      kind: row.kind,
      color: row.color,
      icon: row.icon,
      carryForward: row.carryForward,
      archived: row.archivedAt !== null,
    })),
    futureFunds: futureFunds.map((row) => ({
      name: row.name,
      description: row.description,
      targetAmount: toNumber(row.targetAmount),
      monthlyContribution: toNumber(row.monthlyContribution),
      openingBalance: toNumber(row.openingBalance),
      nextExpenseLabel: row.nextExpenseLabel,
      nextDueDate: row.nextDueDate ? toDateKey(row.nextDueDate) : null,
      color: row.color,
      icon: row.icon,
      archived: row.archivedAt !== null,
    })),
    savingsGoals: savingsGoals.map((row) => ({
      name: row.name,
      kind: row.kind,
      targetAmount: toNumber(row.targetAmount),
      openingBalance: toNumber(row.openingBalance),
      monthlyContribution: toNumber(row.monthlyContribution),
      targetDate: row.targetDate ? toDateKey(row.targetDate) : null,
      notes: row.notes,
      color: row.color,
      archived: row.archivedAt !== null,
    })),
    investments: investments.map((row) => ({
      name: row.name,
      kind: row.kind,
      provider: row.provider,
      monthlyContribution: toNumber(row.monthlyContribution),
      openingBalance: toNumber(row.openingBalance),
      notes: row.notes,
      color: row.color,
      archived: row.archivedAt !== null,
    })),
    monthlyBudgets: budgets.map((budget) => ({
      month: toMonthKey(budget.month),
      incomeTarget: toNumber(budget.incomeTarget),
      note: budget.note,
      items: budget.items.map((item) => ({
        category: item.category.name,
        plannedAmount: toNumber(item.plannedAmount),
      })),
    })),
    netWorthSnapshots: snapshots.map((snapshot) => ({
      month: toMonthKey(snapshot.month),
      note: snapshot.note,
      entries: snapshot.entries.map((entry) => ({
        label: entry.label,
        kind: entry.kind,
        amount: toNumber(entry.amount),
      })),
    })),
    transactions: transactions.map((row) => ({
      date: toDateKey(row.date),
      type: row.type,
      amount: toNumber(row.amount),
      description: row.description,
      notes: row.notes,
      category: row.category?.name ?? null,
      account: row.account?.name ?? null,
      transferAccount: row.transferAccount?.name ?? null,
      futureFund: row.futureFund?.name ?? null,
      savingsGoal: row.savingsGoal?.name ?? null,
      investment: row.investment?.name ?? null,
      isDemo: row.isDemo,
    })),
  });
}
