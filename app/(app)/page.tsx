import Link from "next/link";
import { ArrowRight, PiggyBank, Receipt, Sparkles, Target } from "lucide-react";

import { SpendingDonut } from "@/components/charts/spending-donut";
import { TrendLineChart } from "@/components/charts/trend-charts";
import { BudgetLineList } from "@/components/budget/budget-lines";
import { SummaryCards, SummaryExplainer } from "@/components/dashboard/summary-cards";
import { FundProgressList } from "@/components/funds/fund-progress";
import { GoalProgressCard } from "@/components/savings/goal-progress";
import { Money } from "@/components/money";
import { TransactionList } from "@/components/transactions/transaction-list";
import { AddTransactionButton } from "@/components/transactions/transaction-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { SLOT } from "@/lib/chart-colors";
import { getMonthlyHistory } from "@/lib/db/queries/history";
import { getMonthSnapshot } from "@/lib/db/queries/month";
import { getRecentTransactions } from "@/lib/db/queries/transactions";
import { getCurrentUser } from "@/lib/db/user";
import { addMonths, formatMonthLabel, formatMonthShort, parseMonthKey, toMonthKey } from "@/lib/month";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const params = await searchParams;
  const month = parseMonthKey(params.m);
  const monthKey = toMonthKey(month);
  const user = await getCurrentUser();

  const [snapshot, recent, history] = await Promise.all([
    getMonthSnapshot(user.id, month),
    getRecentTransactions(user.id, month, 6),
    getMonthlyHistory(user.id, addMonths(month, -5), month),
  ]);

  const { summary, budget } = snapshot;
  const lifestyle = snapshot.carryForwardLines[0] ?? null;
  const activeFunds = snapshot.funds.filter((fund) => !fund.archived);
  const emergency = snapshot.emergencyFund;

  const trendData = history.map((row) => ({
    label: formatMonthShort(parseMonthKey(row.monthKey)),
    spent: row.summary.spent,
    income: row.summary.income,
  }));

  const hasActivity = summary.transactionCount > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={formatMonthLabel(month)}
        description={
          hasActivity
            ? `${summary.transactionCount} transaction${summary.transactionCount === 1 ? "" : "s"} recorded`
            : "Nothing recorded for this month yet"
        }
        action={
          <div className="flex items-center gap-3">
            <SummaryExplainer summary={summary} />
            <AddTransactionButton size="sm" className="sm:hidden" label="Add" />
          </div>
        }
      />

      <SummaryCards summary={summary} plannedTotal={budget.totals.planned} />

      {!hasActivity && !budget.exists ? (
        <EmptyState
          icon={Receipt}
          title={`No transactions yet in ${formatMonthLabel(month)}`}
          description="Add your first entry for this month, or switch months to look back at earlier spending. Nothing you record is ever lost."
          action={<AddTransactionButton />}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Where the money went ------------------------------------------- */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Where the money went</CardTitle>
            <CardDescription>
              Everyday spending plus what you set aside into future funds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.spendByCategory.length > 0 ? (
              <SpendingDonut
                total={summary.spent}
                data={snapshot.spendByCategory.map((row) => ({
                  id: row.categoryId,
                  label: row.name,
                  value: row.amount,
                  color: row.color,
                }))}
              />
            ) : (
              <EmptyState
                compact
                title="No spending recorded"
                description={`Add an expense to see how ${formatMonthLabel(month)} breaks down.`}
                action={<AddTransactionButton size="sm" />}
              />
            )}
          </CardContent>
        </Card>

        {/* Budget status --------------------------------------------------- */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Budget</CardTitle>
            <CardDescription>
              {budget.exists ? (
                <>
                  <Money value={budget.totals.actual} className="font-medium text-foreground" /> of{" "}
                  <Money value={budget.totals.planned} /> planned
                </>
              ) : (
                "No budget set for this month"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {budget.exists ? (
              <>
                <Progress
                  value={budget.totals.progress}
                  tone={
                    budget.totals.rawProgress > 100
                      ? "danger"
                      : budget.totals.rawProgress > 85
                        ? "warning"
                        : "default"
                  }
                />
                <BudgetLineList lines={budget.lines.slice(0, 6)} />
                {budget.lines.length > 6 ? (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/budget?m=${monthKey}`}>
                      See all {budget.lines.length} lines <ArrowRight />
                    </Link>
                  </Button>
                ) : null}
              </>
            ) : (
              <EmptyState
                compact
                title="No budget for this month"
                description="Plan what each category should get, then watch it track."
                action={
                  <Button size="sm" asChild>
                    <Link href={`/budget?m=${monthKey}`}>Set a budget</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Earmarked money -------------------------------------------------- */}
      <div className="grid gap-4 lg:grid-cols-3">
        {lifestyle ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-muted-foreground" />
                {lifestyle.categoryName}
              </CardTitle>
              <CardDescription>An allowance that rolls over, not a monthly quota.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-semibold tracking-tight">
                  <Money value={lifestyle.remaining} tone={lifestyle.remaining < 0 ? "negative" : "none"} />
                </span>
                <span className="text-xs text-muted-foreground">available</span>
              </div>
              <Progress
                value={lifestyle.progress}
                tone={lifestyle.isOver ? "danger" : "default"}
                className="h-1.5"
              />
              <dl className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Carried in</dt>
                  <dd className="font-medium">
                    <Money value={lifestyle.carriedIn} />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Allocated</dt>
                  <dd className="font-medium">
                    <Money value={lifestyle.planned} />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Spent</dt>
                  <dd className="font-medium">
                    <Money value={lifestyle.actual} />
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ) : null}

        {emergency ? (
          <GoalProgressCard goal={emergency} highlight />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-4 text-muted-foreground" />
                Emergency fund
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                compact
                title="No emergency fund yet"
                description="Set a target and start putting money aside."
                action={
                  <Button size="sm" asChild>
                    <Link href="/savings">Create one</Link>
                  </Button>
                }
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="size-4 text-muted-foreground" />
              Future funds
            </CardTitle>
            <CardDescription>
              <Money
                value={activeFunds.reduce((sum, fund) => sum + fund.balance, 0)}
                className="font-medium text-foreground"
              />{" "}
              set aside for later
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeFunds.length > 0 ? (
              <>
                <FundProgressList funds={activeFunds.slice(0, 4)} />
                <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                  <Link href={`/future-funds?m=${monthKey}`}>
                    Manage funds <ArrowRight />
                  </Link>
                </Button>
              </>
            ) : (
              <EmptyState
                compact
                title="No future funds"
                description="Reserve a little each month for the bills that arrive occasionally."
                action={
                  <Button size="sm" asChild>
                    <Link href="/future-funds">Create a fund</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity + trend ------------------------------------------ */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>The latest entries in {formatMonthLabel(month)}.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/transactions?m=${monthKey}`}>
                View all <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <TransactionList
              transactions={recent}
              emptyTitle={`Nothing recorded in ${formatMonthLabel(month)}`}
              emptyDescription="Add a transaction and it will appear here straight away."
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Last six months</CardTitle>
            <CardDescription>Income against what you spent.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendLineChart
              data={trendData}
              caption="Income and spending over the last six months"
              series={[
                { key: "income", name: "Income", color: SLOT.green },
                { key: "spent", name: "Spent", color: SLOT.orange },
              ]}
              height={220}
              area
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
