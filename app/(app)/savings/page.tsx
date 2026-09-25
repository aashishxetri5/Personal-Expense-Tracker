import type { Metadata } from "next";
import { Suspense } from "react";
import { StatTile } from "@/components/stat-tile";

import { NewGoalButton } from "@/components/savings/goal-dialog";
import { GoalGrid } from "@/components/savings/goal-grid";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CardGridSkeleton, CardSkeleton, StatsSkeleton } from "@/components/ui/skeletons";
import { getMonthSnapshot } from "@/lib/db/queries/month";
import { getTransactionPage } from "@/lib/db/queries/transactions";
import { getCurrentUser } from "@/lib/db/user";
import { formatMonthLabel, parseMonthKey, toMonthKey } from "@/lib/month";
import { transactionFilterSchema } from "@/lib/validations/transaction";

export const metadata: Metadata = { title: "Savings Goals" };
export const dynamic = "force-dynamic";

export default async function SavingsPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Savings goals"
        description="Money you have deliberately set aside. Emergency savings are kept separate from everything else."
        action={<NewGoalButton />}
      />

      <Suspense key={JSON.stringify(params)} fallback={<SavingsSkeleton />}>
        <SavingsContent params={params} />
      </Suspense>
    </div>
  );
}

/** The page body, streamed in behind its skeleton once the data is ready. */
async function SavingsContent({ params }: { params: { m?: string } }) {
  const month = parseMonthKey(params.m);
  const user = await getCurrentUser();

  const snapshot = await getMonthSnapshot(user.id, month);
  const goalIds = new Set(snapshot.goals.map((goal) => goal.id));

  const activity = await getTransactionPage(
    user.id,
    transactionFilterSchema.parse({ month: toMonthKey(month), pageSize: 50 }),
  );
  const goalActivity = activity.rows.filter(
    (row) => row.savingsGoal !== null && goalIds.has(row.savingsGoal.id),
  );

  const active = snapshot.goals.filter((goal) => !goal.archived);
  const archived = snapshot.goals.filter((goal) => goal.archived);

  const emergency = active.filter((goal) => goal.kind === "EMERGENCY");
  const general = active.filter((goal) => goal.kind === "GENERAL");

  const totalSaved = active.reduce((sum, goal) => sum + goal.current, 0);
  const totalTarget = active.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const savedThisMonth = active.reduce((sum, goal) => sum + goal.contributedThisMonth, 0);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Total saved" value={totalSaved} />
        <StatTile label="Combined target" value={totalTarget} />
        <StatTile label={`Added in ${formatMonthLabel(month)}`} value={savedThisMonth} />
      </div>

      {emergency.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Emergency fund</h2>
          <GoalGrid goals={emergency} />
        </section>
      ) : null}

      <section className="space-y-3">
        {emergency.length > 0 && general.length > 0 ? (
          <h2 className="text-sm font-semibold text-muted-foreground">Other goals</h2>
        ) : null}
        <GoalGrid goals={general} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Savings activity in {formatMonthLabel(month)}</CardTitle>
          <CardDescription>Contributions in, and anything spent out of a goal.</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionList
            transactions={goalActivity}
            emptyTitle={`No savings movements in ${formatMonthLabel(month)}`}
            emptyDescription="Add a transfer into a goal to start building it up."
          />
        </CardContent>
      </Card>

      {archived.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Archived goals</h2>
          <GoalGrid goals={archived} />
        </section>
      ) : null}
    </>
  );
}

/** Stands in for the page body while its data loads; the header is already on screen. */
function SavingsSkeleton() {
  return (
    <>
      <StatsSkeleton />
    <CardGridSkeleton />
    <CardSkeleton rows={4} />
    </>
  );
}
