import type { Metadata } from "next";
import { StatTile } from "@/components/stat-tile";

import { TrendLineChart } from "@/components/charts/trend-charts";
import { NewInvestmentButton } from "@/components/investments/investment-dialog";
import { InvestmentGrid } from "@/components/investments/investment-grid";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SLOT } from "@/lib/chart-colors";
import { getMonthlyHistory } from "@/lib/db/queries/history";
import { getMonthSnapshot } from "@/lib/db/queries/month";
import { getTransactionPage } from "@/lib/db/queries/transactions";
import { getCurrentUser } from "@/lib/db/user";
import { addMonths, formatMonthLabel, formatMonthShort, parseMonthKey, toMonthKey } from "@/lib/month";
import { transactionFilterSchema } from "@/lib/validations/transaction";

export const metadata: Metadata = { title: "Investments" };
export const dynamic = "force-dynamic";

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const params = await searchParams;
  const month = parseMonthKey(params.m);
  const user = await getCurrentUser();

  const [snapshot, history, activity] = await Promise.all([
    getMonthSnapshot(user.id, month),
    getMonthlyHistory(user.id, addMonths(month, -11), month),
    getTransactionPage(
      user.id,
      transactionFilterSchema.parse({ month: toMonthKey(month), type: "INVESTMENT", pageSize: 50 }),
    ),
  ]);

  const active = snapshot.investments.filter((investment) => !investment.archived);
  const archived = snapshot.investments.filter((investment) => investment.archived);

  const totalInvested = active.reduce((sum, item) => sum + item.totalInvested, 0);
  const thisYear = active.reduce((sum, item) => sum + item.investedThisYear, 0);
  const thisMonth = active.reduce((sum, item) => sum + item.investedThisMonth, 0);

  // Running total across the last twelve months, so the line only ever climbs
  // by what was actually contributed.
  let running = totalInvested - history.reduce((sum, row) => sum + row.summary.investments, 0);
  const trend = history.map((row) => {
    running += row.summary.investments;
    return {
      label: formatMonthShort(parseMonthKey(row.monthKey)),
      invested: row.summary.investments,
      total: Math.max(0, running),
    };
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Investments"
        description="What you have put in, month by month. Investing is not spending — it moves money, it does not consume it."
        action={<NewInvestmentButton />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Total invested" value={totalInvested} />
        <StatTile label={`${month.getUTCFullYear()} so far`} value={thisYear} />
        <StatTile label={formatMonthLabel(month)} value={thisMonth} />
      </div>

      <InvestmentGrid investments={active} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contributions over time</CardTitle>
            <CardDescription>What went in each month over the last year.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendLineChart
              data={trend}
              caption="Investment contributions by month"
              series={[{ key: "invested", name: "Invested", color: SLOT.violet }]}
              height={220}
              area
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cumulative total</CardTitle>
            <CardDescription>Everything contributed, added up.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendLineChart
              data={trend}
              caption="Cumulative invested"
              series={[{ key: "total", name: "Total invested", color: SLOT.blue }]}
              height={220}
              area
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investment history in {formatMonthLabel(month)}</CardTitle>
          <CardDescription>Every contribution recorded for the month you are viewing.</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionList
            transactions={activity.rows}
            emptyTitle={`No contributions in ${formatMonthLabel(month)}`}
            emptyDescription="Record an investment transaction and it will appear here."
          />
        </CardContent>
      </Card>

      {archived.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Archived</h2>
          <InvestmentGrid investments={archived} />
        </section>
      ) : null}
    </div>
  );
}
