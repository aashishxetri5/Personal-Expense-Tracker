import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Download, History } from "lucide-react";

import { BudgetVsActualChart } from "@/components/charts/trend-charts";
import { BudgetEditor } from "@/components/budget/budget-editor";
import { BudgetLineList } from "@/components/budget/budget-lines";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton, StatsSkeleton } from "@/components/ui/skeletons";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMonthSnapshot } from "@/lib/db/queries/month";
import { getCategories } from "@/lib/db/queries/reference";
import { getCurrentUser } from "@/lib/db/user";
import { formatMonthLabel, parseMonthKey, toMonthKey } from "@/lib/month";

export const metadata: Metadata = { title: "Budget" };
export const dynamic = "force-dynamic";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const params = await searchParams;
  const month = parseMonthKey(params.m);
  const monthKey = toMonthKey(month);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${formatMonthLabel(month)} budget`}
        description="Each month keeps its own plan. Editing this month never rewrites an earlier one."
        action={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/api/export/budget" prefetch={false}>
                <Download /> Export
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/history">
                <History /> History
              </Link>
            </Button>
          </>
        }
      />

      <Suspense key={JSON.stringify(params)} fallback={<BudgetSkeleton />}>
        <BudgetContent params={params} />
      </Suspense>
    </div>
  );
}

/** The page body, streamed in behind its skeleton once the data is ready. */
async function BudgetContent({ params }: { params: { m?: string } }) {
  const month = parseMonthKey(params.m);
  const monthKey = toMonthKey(month);

  const user = await getCurrentUser();
  const [snapshot, categories] = await Promise.all([
    getMonthSnapshot(user.id, month),
    getCategories(user.id),
  ]);

  const { budget, summary } = snapshot;
  const chartData = budget.lines
    .filter((line) => line.planned > 0 || line.actual > 0)
    .map((line) => ({
      label: line.categoryName,
      planned: line.planned,
      actual: line.actual,
      over: line.isOver,
    }));

  return (
    <>
    {/* Status strip ---------------------------------------------------- */}
    <Card>
      <CardContent className="pt-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Spent against plan
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              <Money value={budget.totals.actual} />
              <span className="text-base font-normal text-muted-foreground">
                {" / "}
                <Money value={budget.totals.planned} />
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {budget.totals.overCount > 0 ? (
              <Badge variant="destructive">
                {budget.totals.overCount} categor{budget.totals.overCount === 1 ? "y" : "ies"} over
              </Badge>
            ) : budget.exists ? (
              <Badge variant="success">On track</Badge>
            ) : null}
            <Badge variant="outline">
              {summary.transactionCount} transaction{summary.transactionCount === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>

        <Progress
          value={budget.totals.progress}
          tone={
            budget.totals.rawProgress > 100
              ? "danger"
              : budget.totals.rawProgress > 85
                ? "warning"
                : "default"
          }
          className="mt-4"
        />
      </CardContent>
    </Card>

    <Tabs defaultValue="plan">
      <TabsList>
        <TabsTrigger value="plan">Plan</TabsTrigger>
        <TabsTrigger value="tracking">Tracking</TabsTrigger>
      </TabsList>

      <TabsContent value="plan">
        <BudgetEditor
          monthKey={monthKey}
          incomeTarget={budget.incomeTarget}
          note={budget.note}
          categories={categories.filter((category) => category.kind !== "INCOME")}
          lines={budget.lines}
          hasBudget={budget.exists}
          defaultMonthlyIncome={user.defaultMonthlyIncome}
        />
      </TabsContent>

      <TabsContent value="tracking" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Planned against actual</CardTitle>
            <CardDescription>
              Bars in red are over their planned amount for {formatMonthLabel(month)}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <BudgetVsActualChart
                data={chartData}
                height={Math.max(220, chartData.length * 34 + 40)}
              />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nothing planned or spent in {formatMonthLabel(month)} yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category detail</CardTitle>
            <CardDescription>
              Money paid out of a future fund or savings goal is not charged here — it was already
              counted when you set it aside.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetLineList lines={budget.lines} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    </>
  );
}

/** Stands in for the page body while its data loads; the header is already on screen. */
function BudgetSkeleton() {
  return (
    <>
      <StatsSkeleton count={1} className="sm:grid-cols-1" />
    <CardSkeleton variant="bars" rows={6} />
    </>
  );
}
