import type { Metadata } from "next";
import { Suspense } from "react";
import { StatTile } from "@/components/stat-tile";

import { FundGrid } from "@/components/funds/fund-grid";
import { NewFundButton } from "@/components/funds/fund-dialog";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CardGridSkeleton, CardSkeleton, StatsSkeleton } from "@/components/ui/skeletons";
import { getMonthSnapshot } from "@/lib/db/queries/month";
import { getTransactionPage } from "@/lib/db/queries/transactions";
import { getCurrentUser } from "@/lib/db/user";
import { formatMonthLabel, parseMonthKey, toMonthKey } from "@/lib/month";
import { transactionFilterSchema } from "@/lib/validations/transaction";

export const metadata: Metadata = { title: "Future Funds" };
export const dynamic = "force-dynamic";

export default async function FutureFundsPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const params = await searchParams;
  const month = parseMonthKey(params.m);
  return (
    <div className="space-y-5">
      <PageHeader
        title="Future funds"
        description="Money reserved now for costs that arrive later. Spending from a fund draws down its balance instead of this month's budget."
        action={<NewFundButton />}
      />

      <Suspense key={JSON.stringify(params)} fallback={<FutureFundsSkeleton />}>
        <FutureFundsContent params={params} />
      </Suspense>
    </div>
  );
}

/** The page body, streamed in behind its skeleton once the data is ready. */
async function FutureFundsContent({ params }: { params: { m?: string } }) {
  const month = parseMonthKey(params.m);
  const user = await getCurrentUser();

  const snapshot = await getMonthSnapshot(user.id, month);
  const fundIds = new Set(snapshot.funds.map((fund) => fund.id));

  // Fund movements for the month, so the ledger behind each balance is visible.
  const activity = await getTransactionPage(
    user.id,
    transactionFilterSchema.parse({ month: toMonthKey(month), pageSize: 50 }),
  );
  const fundActivity = activity.rows.filter(
    (row) => row.futureFund !== null && fundIds.has(row.futureFund.id),
  );

  const active = snapshot.funds.filter((fund) => !fund.archived);
  const archived = snapshot.funds.filter((fund) => fund.archived);

  const totalBalance = active.reduce((sum, fund) => sum + fund.balance, 0);
  const totalTarget = active.reduce((sum, fund) => sum + fund.targetAmount, 0);
  const totalMonthly = active.reduce((sum, fund) => sum + fund.monthlyContribution, 0);

  return (
    <>
    <div className="grid gap-3 sm:grid-cols-3">
      <StatTile label="Reserved" value={totalBalance} />
      <StatTile label="Combined target" value={totalTarget} />
      <StatTile label="Planned each month" value={totalMonthly} />
    </div>

    <FundGrid funds={active} />

    <Card>
      <CardHeader>
        <CardTitle>Fund activity in {formatMonthLabel(month)}</CardTitle>
        <CardDescription>
          Contributions in and spending out, for the month you are viewing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TransactionList
          transactions={fundActivity}
          emptyTitle={`No fund movements in ${formatMonthLabel(month)}`}
          emptyDescription="Record a transfer into a fund, or an expense paid from one, and it will show up here."
        />
      </CardContent>
    </Card>

    {archived.length > 0 ? (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Archived funds</h2>
        <FundGrid funds={archived} />
      </section>
    ) : null}
    </>
  );
}

/** Stands in for the page body while its data loads; the header is already on screen. */
function FutureFundsSkeleton() {
  return (
    <>
      <StatsSkeleton />
    <CardGridSkeleton />
    <CardSkeleton rows={4} />
    </>
  );
}
