import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";

import { Money } from "@/components/money";
import { AddTransactionButton } from "@/components/transactions/transaction-dialog";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/display";
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
        <SummaryTile label="Transactions" value={String(page.total)} />
        <SummaryTile label="Money in" money={page.totals.income} tone="positive" />
        <SummaryTile label="Money out" money={page.totals.outflow} />
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

function SummaryTile({
  label,
  value,
  money,
  tone,
}: {
  label: string;
  value?: string;
  money?: number;
  tone?: "positive";
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xs">
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tracking-tight tabular">
        {money !== undefined ? <Money value={money} tone={tone ?? "none"} /> : value}
      </p>
    </div>
  );
}
