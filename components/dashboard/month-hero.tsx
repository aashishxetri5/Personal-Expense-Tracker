import Link from "next/link";

import { BudgetGauge } from "@/components/dashboard/budget-gauge";
import { SummaryExplainer } from "@/components/dashboard/summary-explainer";
import { Money } from "@/components/money";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MonthlySummary } from "@/lib/calculations/ledger";
import { formatPercent } from "@/lib/format";
import { toMonthKey } from "@/lib/month";

/**
 * Days of the month that have happened, for a per-day average: all of them for
 * a past month, up to today for the current one, none for a future one.
 */
function elapsedDays(month: Date, now = new Date()): number {
  const year = month.getUTCFullYear();
  const index = month.getUTCMonth();
  const inMonth = new Date(Date.UTC(year, index + 1, 0)).getUTCDate();

  if (now.getUTCFullYear() === year && now.getUTCMonth() === index) return now.getUTCDate();
  return month.getTime() < now.getTime() ? inMonth : 0;
}

/**
 * Where the month's income went, as one bar. Spent, saved, invested and left
 * are a partition of income, so the segments add up to the whole — or, when
 * more was assigned than came in, to everything that was assigned.
 */
function AllocationBar({ summary }: { summary: MonthlySummary }) {
  const parts = [
    { key: "spent", label: "Spent", value: summary.spent, color: "var(--chart-2)" },
    { key: "saved", label: "Saved", value: summary.saved, color: "var(--chart-3)" },
    { key: "invested", label: "Invested", value: summary.investments, color: "var(--chart-1)" },
    {
      key: "left",
      label: "Left",
      value: Math.max(0, summary.remaining),
      color: "color-mix(in oklch, var(--foreground) 16%, transparent)",
    },
  ];
  const whole = Math.max(summary.income, summary.allocated);

  if (whole <= 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Record income or spending and this shows where it all went.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted">
        {parts
          .filter((part) => part.value > 0)
          .map((part) => (
            <span
              key={part.key}
              className="h-full"
              style={{ width: `${(part.value / whole) * 100}%`, backgroundColor: part.color }}
            />
          ))}
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {parts.map((part) => (
          <div key={part.key} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: part.color }} />
              {part.label}
              {summary.income > 0 ? (
                <span className="tabular">{formatPercent((part.value / summary.income) * 100, 0)}</span>
              ) : null}
            </dt>
            <dd className="mt-0.5 truncate text-sm font-medium">
              <Money value={part.value} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * The month at a glance: what is left to assign, where the income went, and
 * how much of the budget has gone.
 *
 * @param props - The month, its summary, and its planned budget total.
 * @returns The overview card.
 */
export function MonthHero({
  month,
  summary,
  plannedTotal,
}: {
  month: Date;
  summary: MonthlySummary;
  plannedTotal: number;
}) {
  const count = summary.transactionCount;
  const days = elapsedDays(month);
  const used = plannedTotal > 0 ? (summary.spent / plannedTotal) * 100 : null;
  const planLeft = plannedTotal - summary.spent;
  const overAllocated = summary.remaining < 0;

  return (
    <Card>
      <div className="grid gap-8 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_13rem]">
        <div className="min-w-0 space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">{overAllocated ? "Over-allocated" : "Left to assign"}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              <Money value={summary.remaining} className={overAllocated ? "text-destructive" : undefined} />
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              of <Money value={summary.income} className="text-foreground" /> income
              {count > 0 ? ` · ${count} transaction${count === 1 ? "" : "s"}` : ""}
              {count > 0 && days > 0 && summary.expenses > 0 ? (
                <>
                  {" · about "}
                  <Money value={Math.round(summary.expenses / days)} className="text-foreground" /> a day
                </>
              ) : null}
            </p>
          </div>

          <AllocationBar summary={summary} />

          <SummaryExplainer summary={summary} />
        </div>

        <div className="flex items-center gap-5 border-t border-border pt-6 md:flex-col md:justify-center md:gap-3 md:border-t-0 md:border-l md:pt-0 md:pl-8">
          <BudgetGauge used={used} className="size-28 sm:size-32" />
          <div className="min-w-0 text-sm md:text-center">
            <p className="text-muted-foreground">Budget used</p>
            {used !== null ? (
              <>
                <p className="mt-0.5">
                  <Money value={summary.spent} className="font-medium" />{" "}
                  <span className="text-muted-foreground">
                    of <Money value={plannedTotal} />
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {planLeft >= 0 ? (
                    <>
                      <Money value={planLeft} /> left in the plan
                    </>
                  ) : (
                    <>
                      Over by <Money value={-planLeft} className="text-destructive" />
                    </>
                  )}
                </p>
              </>
            ) : (
              <p className="mt-0.5 text-muted-foreground">No budget set</p>
            )}
            <Link
              href={`/budget?m=${toMonthKey(month)}`}
              className="mt-2 inline-block text-xs font-medium underline-offset-4 hover:underline"
            >
              {used !== null ? "Review budget" : "Set a budget"}
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

/** The overview card while its data loads. */
export function MonthHeroSkeleton() {
  return (
    <Card aria-busy>
      <div className="grid gap-8 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_13rem]">
        <div className="min-w-0 space-y-6">
          <div>
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-2.5 h-9 w-52" />
            <Skeleton className="mt-2.5 h-3.5 w-64 max-w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-1.5">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5 border-t border-border pt-6 md:flex-col md:justify-center md:gap-3 md:border-t-0 md:border-l md:pt-0 md:pl-8">
          <Skeleton className="size-28 rounded-full sm:size-32" />
          <div className="space-y-2 md:flex md:flex-col md:items-center">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        </div>
      </div>
    </Card>
  );
}
