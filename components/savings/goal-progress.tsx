"use client";

import * as React from "react";
import { ShieldCheck, Target } from "lucide-react";

import { useChartTheme } from "@/components/charts/chart-kit";
import { Money } from "@/components/money";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, ColorDot } from "@/components/ui/display";
import { Progress } from "@/components/ui/primitives";
import { formatPercent } from "@/lib/format";
import { formatDateLong, parseDateKey } from "@/lib/month";
import type { SavingsGoalWithProgress } from "@/lib/types";
import { cn } from "@/lib/utils";

function GoalBody({ goal }: { goal: SavingsGoalWithProgress }) {
  const targetDate = parseDateKey(goal.targetDate);
  const remaining = Math.max(0, goal.targetAmount - goal.current);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-semibold tracking-tight">
          <Money value={goal.current} />
        </span>
        {goal.targetAmount > 0 ? (
          <span className="text-xs text-muted-foreground">
            of <Money value={goal.targetAmount} /> · {formatPercent(goal.progress, 0)}
          </span>
        ) : null}
      </div>

      <Progress
        value={goal.progress}
        tone={goal.progress >= 100 ? "success" : "default"}
      />

      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Monthly plan</dt>
          <dd className="mt-0.5 font-medium">
            <Money value={goal.monthlyContribution} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Added this month</dt>
          <dd className="mt-0.5 font-medium">
            <Money value={goal.contributedThisMonth} signed={goal.contributedThisMonth > 0} />
          </dd>
        </div>
        {remaining > 0 ? (
          <div>
            <dt className="text-muted-foreground">Still needed</dt>
            <dd className="mt-0.5 font-medium">
              <Money value={remaining} />
            </dd>
          </div>
        ) : null}
        {goal.monthsRemaining ? (
          <div>
            <dt className="text-muted-foreground">At this rate</dt>
            <dd className="mt-0.5 font-medium">
              {goal.monthsRemaining} month{goal.monthsRemaining === 1 ? "" : "s"}
            </dd>
          </div>
        ) : null}
        {targetDate ? (
          <div className="col-span-2">
            <dt className="text-muted-foreground">Target date</dt>
            <dd className="mt-0.5 font-medium">{formatDateLong(targetDate)}</dd>
          </div>
        ) : null}
      </dl>

      {goal.notes ? (
        <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
          {goal.notes}
        </p>
      ) : null}
    </div>
  );
}

/** Dashboard card — used for the emergency fund. */
export function GoalProgressCard({
  goal,
  highlight = false,
}: {
  goal: SavingsGoalWithProgress;
  highlight?: boolean;
}) {
  const Icon = goal.kind === "EMERGENCY" ? ShieldCheck : Target;

  return (
    <Card className={cn(highlight && "ring-1 ring-primary/15")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          {goal.name}
        </CardTitle>
        <CardDescription>
          {goal.kind === "EMERGENCY"
            ? "Kept separate from ordinary savings."
            : "Money set aside for this goal."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GoalBody goal={goal} />
      </CardContent>
    </Card>
  );
}

/** Savings page card, with room for actions. */
export function GoalCard({
  goal,
  actions,
}: {
  goal: SavingsGoalWithProgress;
  actions?: React.ReactNode;
}) {
  const theme = useChartTheme();

  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <ColorDot color={theme.series(goal.color)} />
          <span className="truncate">{goal.name}</span>
          {goal.kind === "EMERGENCY" ? <Badge variant="primary">Emergency</Badge> : null}
          {goal.archived ? <Badge variant="outline">Archived</Badge> : null}
        </h3>
        {actions}
      </header>

      <div className="mt-4">
        <GoalBody goal={goal} />
      </div>
    </article>
  );
}
