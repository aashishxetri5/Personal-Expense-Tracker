import { cache } from "react";

import { summarise, type MonthlySummary } from "@/lib/calculations/ledger";
import { netWorthTotals } from "@/lib/calculations/balances";
import { prisma } from "@/lib/db/prisma";
import { ledgerForRange } from "@/lib/db/queries/shared";
import { round2, toNumber } from "@/lib/format";
import {
  formatMonthLabel,
  formatMonthShort,
  monthEnd,
  monthRange,
  monthStart,
  toMonthKey,
} from "@/lib/month";
import type { LedgerEntry, NetWorthSnapshotDTO } from "@/lib/types";

export type MonthHistoryRow = {
  monthKey: string;
  label: string;
  shortLabel: string;
  summary: MonthlySummary;
  plannedTotal: number;
  incomeTarget: number;
  hasBudget: boolean;
  netWorth: number | null;
};

/** Per-month totals across a range — the Monthly History table and trend charts. */
export const getMonthlyHistory = cache(
  async (userId: string, from: Date, to: Date): Promise<MonthHistoryRow[]> => {
    const months = monthRange(from, to);
    if (months.length === 0) return [];

    const [entries, budgets, snapshots] = await Promise.all([
      ledgerForRange(userId, from, to),
      prisma.monthlyBudget.findMany({
        where: { userId, month: { gte: monthStart(from), lt: monthEnd(to) } },
        include: { items: { select: { plannedAmount: true } } },
      }),
      prisma.netWorthSnapshot.findMany({
        where: { userId, month: { gte: monthStart(from), lt: monthEnd(to) } },
        include: { entries: { select: { kind: true, amount: true } } },
      }),
    ]);

    const byMonth = new Map<string, LedgerEntry[]>();
    for (const entry of entries) {
      const key = toMonthKey(entry.date);
      const bucket = byMonth.get(key);
      if (bucket) bucket.push(entry);
      else byMonth.set(key, [entry]);
    }

    const budgetByMonth = new Map(
      budgets.map((budget) => [
        toMonthKey(budget.month),
        {
          planned: round2(budget.items.reduce((sum, item) => sum + toNumber(item.plannedAmount), 0)),
          incomeTarget: toNumber(budget.incomeTarget),
        },
      ]),
    );

    const netWorthByMonth = new Map(
      snapshots.map((snapshot) => [
        toMonthKey(snapshot.month),
        netWorthTotals(
          snapshot.entries.map((entry) => ({ kind: entry.kind, amount: toNumber(entry.amount) })),
        ).netWorth,
      ]),
    );

    return months.map((month) => {
      const key = toMonthKey(month);
      const budget = budgetByMonth.get(key);
      return {
        monthKey: key,
        label: formatMonthLabel(month),
        shortLabel: formatMonthShort(month),
        summary: summarise(byMonth.get(key) ?? []),
        plannedTotal: budget?.planned ?? 0,
        incomeTarget: budget?.incomeTarget ?? 0,
        hasBudget: budget !== undefined,
        netWorth: netWorthByMonth.get(key) ?? null,
      };
    });
  },
);

/** The first month that has any activity — used to bound month pickers. */
export const getFirstActivityMonth = cache(async (userId: string): Promise<Date | null> => {
  const [firstTxn, firstBudget] = await Promise.all([
    prisma.transaction.findFirst({ where: { userId }, orderBy: { date: "asc" }, select: { date: true } }),
    prisma.monthlyBudget.findFirst({ where: { userId }, orderBy: { month: "asc" }, select: { month: true } }),
  ]);

  const candidates = [firstTxn?.date, firstBudget?.month].filter(Boolean) as Date[];
  if (candidates.length === 0) return null;
  return monthStart(new Date(Math.min(...candidates.map((d) => d.getTime()))));
});

export const getNetWorthSnapshots = cache(async (userId: string): Promise<NetWorthSnapshotDTO[]> => {
  const rows = await prisma.netWorthSnapshot.findMany({
    where: { userId },
    orderBy: { month: "asc" },
    include: { entries: { orderBy: [{ kind: "asc" }, { sortOrder: "asc" }] } },
  });

  return rows.map((row) => {
    const entries = row.entries.map((entry) => ({
      id: entry.id,
      label: entry.label,
      kind: entry.kind,
      amount: toNumber(entry.amount),
      sortOrder: entry.sortOrder,
    }));
    const totals = netWorthTotals(entries);

    return {
      id: row.id,
      month: toMonthKey(row.month),
      note: row.note,
      entries,
      ...totals,
    };
  });
});
