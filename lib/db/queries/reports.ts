import { cache } from "react";

import { netWorthTotals } from "@/lib/calculations/balances";
import { categoryActuals, summarise, type MonthlySummary } from "@/lib/calculations/ledger";
import { prisma } from "@/lib/db/prisma";
import { getCategories } from "@/lib/db/queries/reference";
import { ledgerForRange } from "@/lib/db/queries/shared";
import { round2, toNumber } from "@/lib/format";
import { monthEnd, monthStart } from "@/lib/month";
import type { CategoryKind } from "@/lib/types";

export type ReportPeriod = "month" | "quarter" | "year";

export type ReportCategoryRow = {
  categoryId: string;
  name: string;
  color: string;
  kind: CategoryKind;
  amount: number;
  share: number;
};

export type ReportData = {
  summary: MonthlySummary;
  categories: ReportCategoryRow[];
  plannedTotal: number;
  monthCount: number;
  averageMonthlySpend: number;
  netWorth: { start: number | null; end: number | null; change: number | null };
};

/** Aggregates for an arbitrary month range — the Reports page. */
export const getReport = cache(
  async (userId: string, from: Date, to: Date): Promise<ReportData> => {
    const [entries, categories, budgets, snapshots] = await Promise.all([
      ledgerForRange(userId, from, to),
      getCategories(userId),
      prisma.monthlyBudget.findMany({
        where: { userId, month: { gte: monthStart(from), lt: monthEnd(to) } },
        include: { items: { select: { plannedAmount: true } } },
      }),
      prisma.netWorthSnapshot.findMany({
        where: { userId, month: { gte: monthStart(from), lt: monthEnd(to) } },
        orderBy: { month: "asc" },
        include: { entries: { select: { kind: true, amount: true } } },
      }),
    ]);

    const summary = summarise(entries);
    const actuals = categoryActuals(entries);
    const categoryById = new Map(categories.map((category) => [category.id, category]));

    const total = [...actuals.values()].reduce((sum, value) => sum + value, 0);
    const rows: ReportCategoryRow[] = [...actuals.entries()]
      .flatMap(([categoryId, amount]): ReportCategoryRow[] => {
        const category = categoryById.get(categoryId);
        // Income never belongs in a spending breakdown.
        if (!category || category.kind === "INCOME") return [];
        return [
          {
            categoryId,
            name: category.name,
            color: category.color,
            kind: category.kind,
            amount,
            share: total > 0 ? round2((amount / total) * 100) : 0,
          },
        ];
      })
      .sort((a, b) => b.amount - a.amount);

    const plannedTotal = round2(
      budgets.reduce(
        (sum, budget) => sum + budget.items.reduce((inner, item) => inner + toNumber(item.plannedAmount), 0),
        0,
      ),
    );

    const monthCount = Math.max(
      1,
      (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth()) + 1,
    );

    const netWorthValues = snapshots.map(
      (snapshot) =>
        netWorthTotals(
          snapshot.entries.map((entry) => ({ kind: entry.kind, amount: toNumber(entry.amount) })),
        ).netWorth,
    );
    const start = netWorthValues.length > 0 ? netWorthValues[0] : null;
    const end = netWorthValues.length > 0 ? netWorthValues[netWorthValues.length - 1] : null;

    return {
      summary,
      categories: rows,
      plannedTotal,
      monthCount,
      averageMonthlySpend: round2(summary.spent / monthCount),
      netWorth: {
        start,
        end,
        change: start !== null && end !== null ? round2(end - start) : null,
      },
    };
  },
);
