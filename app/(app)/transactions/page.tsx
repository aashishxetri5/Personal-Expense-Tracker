import type { Metadata } from "next";
import { StatTile } from "@/components/stat-tile";
import Link from "next/link";
import { Download } from "lucide-react";

import { AddTransactionButton } from "@/components/transactions/transaction-dialog";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { getCategories } from "@/lib/db/queries/reference";
import { getTransactionPage } from "@/lib/db/queries/transactions";
import { getCurrentUser } from "@/lib/db/user";
import { formatMonthLabel, parseMonthKey, toMonthKey } from "@/lib/month";
import { transactionFilterSchema } from "@/lib/validations/transaction";

export const metadata: Metadata = { title: "Transactions" };
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const month = parseMonthKey(typeof params.m === "string" ? params.m : undefined);
  const monthKey = toMonthKey(month);
  const showAllMonths = params.all === "1";

  // Unknown or malformed params fall back to the defaults rather than erroring.
  const parsed = transactionFilterSchema.safeParse({
    ...params,
    month: showAllMonths ? undefined : monthKey,
  });
  const filter = parsed.success
    ? parsed.data
    : transactionFilterSchema.parse({ month: showAllMonths ? undefined : monthKey });

  const user = await getCurrentUser();
  const [page, categories] = await Promise.all([
    getTransactionPage(user.id, filter),
    getCategories(user.id),
  ]);

  const exportParams = new URLSearchParams();
  if (!showAllMonths) exportParams.set("month", monthKey);
  if (filter.search) exportParams.set("search", filter.search);
  if (filter.type) exportParams.set("type", filter.type);
  if (filter.categoryId) exportParams.set("categoryId", filter.categoryId);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transactions"
        description={
          showAllMonths
            ? "Your complete history, across every month."
            : `${formatMonthLabel(month)} — switch months at the top, nothing is ever removed.`
        }
        action={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/api/export/transactions?${exportParams.toString()}`} prefetch={false}>
                <Download /> Export CSV
              </Link>
            </Button>
            <AddTransactionButton size="sm" />
          </>
        }
      />

      <TransactionFilters categories={categories} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Transactions" text={String(page.total)} />
        <StatTile label="Money in" value={page.totals.income} tone="positive" />
        <StatTile label="Money out" value={page.totals.outflow} />
      </div>

      <Card>
        <CardContent className="pt-5">
          <TransactionList
            transactions={page.rows}
            emptyTitle={
              filter.search || filter.type || filter.categoryId
                ? "No transactions match those filters"
                : `No transactions in ${formatMonthLabel(month)}`
            }
            emptyDescription={
              filter.search || filter.type || filter.categoryId
                ? "Try widening the filters, or switch to all months."
                : "Start tracking this month by adding your first entry."
            }
          />
        </CardContent>
        {page.total > 0 ? (
          <CardFooter className="justify-between">
            <Pagination
              page={page.page}
              pageCount={page.pageCount}
              total={page.total}
              pageSize={page.pageSize}
            />
          </CardFooter>
        ) : null}
      </Card>
    </div>
  );
}
