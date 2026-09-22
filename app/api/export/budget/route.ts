import type { NextRequest } from "next/server";

import { csvResponse, toCsv } from "@/lib/csv";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/db/user";
import { toNumber } from "@/lib/format";
import { toMonthKey } from "@/lib/month";

export const dynamic = "force-dynamic";

/** Every month's plan, one row per budget line — history included. */
export async function GET(_request: NextRequest) {
  const user = await getCurrentUser();

  const budgets = await prisma.monthlyBudget.findMany({
    where: { userId: user.id },
    orderBy: { month: "asc" },
    include: {
      items: { include: { category: { select: { name: true, kind: true } } } },
    },
  });

  const rows: unknown[][] = [];
  for (const budget of budgets) {
    if (budget.items.length === 0) {
      rows.push([toMonthKey(budget.month), toNumber(budget.incomeTarget).toFixed(2), "", "", "0.00"]);
      continue;
    }
    for (const item of budget.items) {
      rows.push([
        toMonthKey(budget.month),
        toNumber(budget.incomeTarget).toFixed(2),
        item.category.name,
        item.category.kind,
        toNumber(item.plannedAmount).toFixed(2),
      ]);
    }
  }

  return csvResponse(
    "budgets.csv",
    toCsv(["Month", "Income target", "Category", "Category kind", "Planned amount"], rows),
  );
}
