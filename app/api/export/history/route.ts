import type { NextRequest } from "next/server";

import { csvResponse, toCsv } from "@/lib/csv";
import { getFirstActivityMonth, getMonthlyHistory } from "@/lib/db/queries/history";
import { getCurrentUser } from "@/lib/db/user";
import { addMonths, currentMonth, parseMonthKey } from "@/lib/month";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  const to = parseMonthKey(request.nextUrl.searchParams.get("to") ?? undefined);
  const firstActivity = await getFirstActivityMonth(user.id);
  const from = firstActivity ?? addMonths(currentMonth(), -11);

  const rows = await getMonthlyHistory(user.id, from, to);

  const csv = toCsv(
    [
      "Month",
      "Income",
      "Everyday spending",
      "Into future funds",
      "Spent (total)",
      "Invested",
      "Saved into goals",
      "Remaining",
      "Paid from reserves",
      "Planned budget",
      "Net worth",
      "Transactions",
    ],
    rows.map((row) => [
      row.monthKey,
      row.summary.income.toFixed(2),
      row.summary.expenses.toFixed(2),
      row.summary.fundContributions.toFixed(2),
      row.summary.spent.toFixed(2),
      row.summary.investments.toFixed(2),
      row.summary.saved.toFixed(2),
      row.summary.remaining.toFixed(2),
      (row.summary.fundExpenses + row.summary.goalWithdrawals).toFixed(2),
      row.plannedTotal.toFixed(2),
      row.netWorth === null ? "" : row.netWorth.toFixed(2),
      row.summary.transactionCount,
    ]),
  );

  return csvResponse("monthly-history.csv", csv);
}
