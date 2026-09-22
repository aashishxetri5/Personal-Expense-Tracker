import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Download } from "lucide-react";

import { GroupedBarChart, TrendLineChart } from "@/components/charts/trend-charts";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SLOT } from "@/lib/chart-colors";
import { getFirstActivityMonth, getMonthlyHistory } from "@/lib/db/queries/history";
import { getCurrentUser } from "@/lib/db/user";
import { formatPercent, round2 } from "@/lib/format";
import { addMonths, currentMonth, formatMonthLabel, formatMonthShort, parseMonthKey } from "@/lib/month";

export const metadata: Metadata = { title: "Monthly History" };
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  const to = currentMonth();
  const firstActivity = await getFirstActivityMonth(user.id);

  // Show everything recorded, but never fewer than the last six months so the
  // page has shape even on a fresh database.
  const from = firstActivity && firstActivity < addMonths(to, -5) ? firstActivity : addMonths(to, -5);
  const rows = await getMonthlyHistory(user.id, from, to);
  const withActivity = rows.filter((row) => row.summary.transactionCount > 0 || row.hasBudget);

  const chartData = rows.map((row) => ({
    label: formatMonthShort(parseMonthKey(row.monthKey)),
    income: row.summary.income,
    spent: row.summary.spent,
    invested: row.summary.investments,
    saved: round2(row.summary.saved + row.summary.remaining),
  }));

  const totals = rows.reduce(
    (acc, row) => ({
      income: acc.income + row.summary.income,
      spent: acc.spent + row.summary.spent,
      invested: acc.invested + row.summary.investments,
      saved: acc.saved + row.summary.saved,
      remaining: acc.remaining + row.summary.remaining,
    }),
    { income: 0, spent: 0, invested: 0, saved: 0, remaining: 0 },
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Monthly history"
        description="Every month you have tracked, preserved exactly as it was. Click a month to open it."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/api/export/history" prefetch={false}>
              <Download /> Export CSV
            </Link>
          </Button>
        }
      />

      {withActivity.length === 0 ? (
        <EmptyState
          title="No history yet"
          description="Once you record transactions or set a budget, each month is preserved here permanently."
          action={
            <Button asChild>
              <Link href="/">Go to the dashboard</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Income against spending</CardTitle>
                <CardDescription>Month by month, over the period you have tracked.</CardDescription>
              </CardHeader>
              <CardContent>
                <GroupedBarChart
                  data={chartData}
                  caption="Income and spending by month"
                  series={[
                    { key: "income", name: "Income", color: SLOT.green },
                    { key: "spent", name: "Spent", color: SLOT.orange },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Saved and invested</CardTitle>
                <CardDescription>
                  What was left over plus deliberate savings, alongside investment contributions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrendLineChart
                  data={chartData}
                  caption="Savings and investments by month"
                  series={[
                    { key: "saved", name: "Saved", color: SLOT.blue },
                    { key: "invested", name: "Invested", color: SLOT.violet },
                  ]}
                  height={260}
                  area
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Month by month</CardTitle>
              <CardDescription>
                &ldquo;Saved&rdquo; is money moved into goals. &ldquo;Left over&rdquo; is income you
                never assigned to anything.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead className="text-right">Spending</TableHead>
                    <TableHead className="text-right">Invested</TableHead>
                    <TableHead className="text-right">Saved</TableHead>
                    <TableHead className="text-right">Left over</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...rows].reverse().map((row) => {
                    const empty = row.summary.transactionCount === 0 && !row.hasBudget;
                    return (
                      <TableRow key={row.monthKey} className={empty ? "opacity-50" : undefined}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {row.label}
                          {row.summary.transactionCount > 0 ? (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              {row.summary.transactionCount} txn
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right">
                          <Money value={row.summary.income} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Money value={row.summary.spent} />
                          {row.plannedTotal > 0 ? (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              / <Money value={row.plannedTotal} />
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right">
                          <Money value={row.summary.investments} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Money value={row.summary.saved} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Money
                            value={row.summary.remaining}
                            tone={row.summary.remaining < 0 ? "negative" : "none"}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {row.summary.income > 0 ? (
                            <Badge variant={row.summary.savingsRate >= 20 ? "success" : "outline"}>
                              {formatPercent(row.summary.savingsRate, 0)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link
                              href={`/?m=${row.monthKey}`}
                              aria-label={`Open ${formatMonthLabel(parseMonthKey(row.monthKey))}`}
                            >
                              <ArrowUpRight />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-semibold">Total</TableCell>
                    <TableCell className="text-right font-semibold">
                      <Money value={totals.income} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <Money value={totals.spent} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <Money value={totals.invested} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <Money value={totals.saved} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <Money value={totals.remaining} tone={totals.remaining < 0 ? "negative" : "none"} />
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
