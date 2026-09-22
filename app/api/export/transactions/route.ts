import type { NextRequest } from "next/server";

import { csvResponse, toCsv } from "@/lib/csv";
import { getTransactionsForExport } from "@/lib/db/queries/transactions";
import { getCurrentUser } from "@/lib/db/user";
import { transactionFilterSchema } from "@/lib/validations/transaction";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = transactionFilterSchema.safeParse(raw);
  const filter = parsed.success ? parsed.data : transactionFilterSchema.parse({});

  const user = await getCurrentUser();
  const rows = await getTransactionsForExport(user.id, filter);

  const csv = toCsv(
    [
      "Date",
      "Type",
      "Description",
      "Category",
      "Amount",
      "Currency",
      "Payment method",
      "Future fund",
      "Savings goal",
      "Investment",
      "Transfer to",
      "Notes",
      "Demo data",
    ],
    rows.map((row) => [
      row.date,
      row.type,
      row.description,
      row.category?.name ?? "",
      row.amount.toFixed(2),
      user.currency,
      row.account?.name ?? "",
      row.futureFund?.name ?? "",
      row.savingsGoal?.name ?? "",
      row.investment?.name ?? "",
      row.transferAccount?.name ?? "",
      row.notes ?? "",
      row.isDemo ? "yes" : "no",
    ]),
  );

  const suffix = filter.month ? `-${filter.month}` : "";
  return csvResponse(`transactions${suffix}.csv`, csv);
}
