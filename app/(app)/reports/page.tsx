import type { Metadata } from "next";

import { SpendingDonut } from "@/components/charts/spending-donut";
import { GroupedBarChart } from "@/components/charts/trend-charts";
import { Money } from "@/components/money";
import { StatTile } from "@/components/stat-tile";
import { PeriodPicker } from "@/components/reports/period-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SLOT } from "@/lib/chart-colors";
import { getMonthlyHistory } from "@/lib/db/queries/history";
import { getReport, type ReportPeriod } from "@/lib/db/queries/reports";
import { getCurrentUser } from "@/lib/db/user";
import { formatPercent } from "@/lib/format";
import {
  formatMonthLabel,
  formatMonthShort,
  parseMonthKey,
  quarterOf,
  quarterStart,
  addMonths,
  yearStart,
} from "@/lib/month";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

function periodRange(period: ReportPeriod, month: Date): { from: Date; to: Date; label: string } {
  switch (period) {
    case "quarter": {
      const from = quarterStart(month);
      return {
        from,
        to: addMonths(from, 2),
        label: `Q${quarterOf(month)} ${month.getUTCFullYear()}`,
      };
    }
    case "year": {
      const from = yearStart(month);
      return { from, to: addMonths(from, 11), label: String(month.getUTCFullYear()) };
    }
    case "month":
    default:
      return { from: month, to: month, label: formatMonthLabel(month) };
  }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; period?: string }>;
}) {
  const params = await searchParams;
  const month = parseMonthKey(params.m);
  const period: ReportPeriod =
    params.period === "quarter" || params.period === "year" ? params.period : "month";

  const { from, to, label } = periodRange(period, month);
  const user = await getCurrentUser();

  const [report, history] = await Promise.all([
    getReport(user.id, from, to),
    getMonthlyHistory(user.id, from, to),
  ]);

  const { summary } = report;
  const chartData = history.map((row) => ({
    label: formatMonthShort(parseMonthKey(row.monthKey)),
    income: row.summary.income,
    spent: row.summary.spent,
    invested: row.summary.investments,
  }));

  const hasData = summary.transactionCount > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description={`${label} — driven by the month selected at the top of the page.`}
        action={<PeriodPicker value={period} />}
      />

      {!hasData ? (
        <EmptyState
          title={`Nothing recorded for ${label}`}
          description="Switch to a period with transactions, or start recording this one."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Income" value={summary.income} />
            <StatTile label="Spent" value={summary.spent} />
            <StatTile label="Invested" value={summary.investments} />
            <StatTile
              label="Savings rate"
              text={formatPercent(summary.savingsRate, 0)}
              badge={
                summary.savingsRate >= 20 ? <Badge variant="success">Healthy</Badge> : undefined
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Spending by category</CardTitle>
                <CardDescription>Across the whole of {label}.</CardDescription>
              </CardHeader>
              <CardContent>
                <SpendingDonut
                  total={summary.spent}
                  data={report.categories.map((row) => ({
                    id: row.categoryId,
                    label: row.name,
                    value: row.amount,
                    color: row.color,
                  }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Month by month</CardTitle>
                <CardDescription>How each month in the period compares.</CardDescription>
              </CardHeader>
              <CardContent>
                <GroupedBarChart
                  data={chartData}
                  caption={`Income, spending and investments across ${label}`}
                  series={[
                    { key: "income", name: "Income", color: SLOT.green },
                    { key: "spent", name: "Spent", color: SLOT.orange },
                    { key: "invested", name: "Invested", color: SLOT.violet },
                  ]}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Category detail</CardTitle>
                <CardDescription>
                  Everyday spending plus what was set aside into funds and goals.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                      <TableHead className="text-right">Per month</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.categories.map((row) => (
                      <TableRow key={row.categoryId}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-right">
                          <Money value={row.amount} />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground tabular">
                          {formatPercent(row.share, 1)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          <Money value={row.amount / report.monthCount} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Period summary</CardTitle>
                <CardDescription>
                  {report.monthCount} month{report.monthCount === 1 ? "" : "s"} of activity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-border text-sm">
                  <Row label="Total income" value={summary.income} />
                  <Row label="Everyday spending" value={summary.expenses} />
                  <Row label="Into future funds" value={summary.fundContributions} />
                  <Row label="Paid from reserves" value={summary.fundExpenses + summary.goalWithdrawals} />
                  <Row label="Invested" value={summary.investments} />
                  <Row label="Saved into goals" value={summary.saved} />
                  <Row label="Left unassigned" value={summary.remaining} tone />
                  <Row label="Planned budget" value={report.plannedTotal} />
                  <Row label="Average monthly spend" value={report.averageMonthlySpend} />
                  {report.netWorth.change !== null ? (
                    <Row label="Net worth change" value={report.netWorth.change} tone />
                  ) : null}
                </dl>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, tone = false }: { label: string; value: number; tone?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">
        <Money value={value} tone={tone ? "auto" : "none"} />
      </dd>
    </div>
  );
}
