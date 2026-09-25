"use client";

import * as React from "react";

import { useChartTheme } from "@/components/charts/chart-kit";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { ColorDot } from "@/components/ui/color-dot";
import { Progress } from "@/components/ui/progress";
import type { FutureFundWithBalance } from "@/lib/types";
import { formatPercent } from "@/lib/format";
import { formatDateLong, parseDateKey } from "@/lib/month";
import { cn } from "@/lib/utils";

/** Compact fund row used on the dashboard. */
export function FundProgressList({ funds }: { funds: FutureFundWithBalance[] }) {
  const theme = useChartTheme();

  return (
    <ul className="space-y-3.5">
      {funds.map((fund) => (
        <li key={fund.id}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <ColorDot color={theme.series(fund.color)} />
              <span className="truncate text-sm font-medium">{fund.name}</span>
            </span>
            <span className="shrink-0 text-sm font-medium tabular">
              <Money value={fund.balance} />
            </span>
          </div>
          <Progress
            value={fund.progress}
            className="mt-1.5 h-1.5"
            tone={fund.progress >= 100 ? "success" : "default"}
          />
        </li>
      ))}
    </ul>
  );
}

/** Full fund card used on the Future Funds page. */
export function FundCard({
  fund,
  actions,
  className,
}: {
  fund: FutureFundWithBalance;
  actions?: React.ReactNode;
  className?: string;
}) {
  const theme = useChartTheme();
  const dueDate = parseDateKey(fund.nextDueDate);
  const shortfall = Math.max(0, fund.targetAmount - fund.balance);

  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-card transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lift",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-display text-[1.05rem] leading-snug font-semibold">
            <ColorDot color={theme.series(fund.color)} />
            <span className="truncate">{fund.name}</span>
          </h3>
          {fund.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{fund.description}</p>
          ) : null}
        </div>
        {actions}
      </header>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight">
          <Money value={fund.balance} />
        </span>
        {fund.targetAmount > 0 ? (
          <span className="text-xs text-muted-foreground">
            of <Money value={fund.targetAmount} />
          </span>
        ) : null}
      </div>

      <Progress
        value={fund.progress}
        tone={fund.progress >= 100 ? "success" : "default"}
        className="mt-3"
      />

      <p className="mt-1.5 text-xs text-muted-foreground">
        {fund.targetAmount > 0
          ? `${formatPercent(fund.progress, 0)} funded · ${shortfall > 0 ? "" : "target met"}`
          : "No target set"}
        {shortfall > 0 ? (
          <>
            <Money value={shortfall} /> to go
          </>
        ) : null}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
        <div>
          <dt className="text-muted-foreground">Monthly plan</dt>
          <dd className="mt-0.5 font-medium">
            <Money value={fund.monthlyContribution} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">This month</dt>
          <dd className="mt-0.5 font-medium">
            <Money value={fund.contributedThisMonth} signed={fund.contributedThisMonth > 0} />
          </dd>
        </div>
        {fund.nextExpenseLabel ? (
          <div className="col-span-2">
            <dt className="text-muted-foreground">Next expected</dt>
            <dd className="mt-0.5 flex flex-wrap items-center gap-2 font-medium">
              {fund.nextExpenseLabel}
              {dueDate ? (
                <Badge variant="outline">{formatDateLong(dueDate)}</Badge>
              ) : null}
            </dd>
          </div>
        ) : null}
        {fund.spentThisMonth > 0 ? (
          <div className="col-span-2">
            <dt className="text-muted-foreground">Paid from this fund this month</dt>
            <dd className="mt-0.5 font-medium text-destructive">
              <Money value={-fund.spentThisMonth} signed />
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
