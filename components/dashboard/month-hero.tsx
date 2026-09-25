import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BudgetGauge } from "@/components/dashboard/budget-gauge";
import { SummaryExplainer } from "@/components/dashboard/summary-explainer";
import { Money } from "@/components/money";
import { AddTransactionButton } from "@/components/transactions/transaction-dialog";
import { AccentTitle } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { MonthlySummary } from "@/lib/calculations/ledger";
import { CATEGORICAL_SLOTS } from "@/lib/chart-colors";
import { formatPercent } from "@/lib/format";
import { formatMonthLabel, toMonthKey } from "@/lib/month";

// The hero is always ink, so the palette's dark steps apply.
const slot = (name: string) => CATEGORICAL_SLOTS.find((item) => item.name === name)!.dark;

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
    { key: "spent", label: "Spent", value: summary.spent, color: slot("orange") },
    { key: "saved", label: "Saved", value: summary.saved, color: slot("aqua") },
    { key: "invested", label: "Invested", value: summary.investments, color: slot("violet") },
    { key: "left", label: "Left", value: Math.max(0, summary.remaining), color: "var(--gold)" },
  ];
  const whole = Math.max(summary.income, summary.allocated);

  if (whole <= 0) {
    return (
      <div className="space-y-3">
        <div className="h-3 rounded-full bg-white/[0.07]" />
        <p className="text-sm text-muted-foreground">
          Record income or spending and this bar shows where it all went.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex h-3 gap-[3px] overflow-hidden rounded-full bg-white/[0.07] animate-[reveal_0.9s_cubic-bezier(0.65,0,0.35,1)_0.2s_both]">
        {parts
          .filter((part) => part.value > 0)
          .map((part) => (
            <span
              key={part.key}
              className="h-full first:rounded-l-full last:rounded-r-full"
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
                <span className="tabular text-muted-foreground/70">
                  {formatPercent((part.value / summary.income) * 100, 0)}
                </span>
              ) : null}
            </dt>
            <dd className="mt-0.5 truncate text-[15px] font-semibold">
              <Money value={part.value} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * The dashboard's opening statement: the month, what is left to assign, where
 * the income went, and how much of the budget has gone.
 *
 * @param props - The month, its summary, and its planned budget total.
 * @returns The hero panel.
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
    <HeroFrame month={month}>
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-0">
        <div className="min-w-0 lg:pr-10">
          <HeroTitle month={month} />
          <p className="mt-2 text-sm text-muted-foreground">
            {count > 0 ? `${count} transaction${count === 1 ? "" : "s"} recorded` : "Nothing recorded yet"}
            {count > 0 && days > 0 && summary.expenses > 0 ? (
              <>
                {" · about "}
                <Money value={Math.round(summary.expenses / days)} className="text-foreground" /> a day on everyday spending
              </>
            ) : null}
          </p>

          <div className="mt-7">
            <p className="text-[10.5px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              {overAllocated ? "Over-allocated" : "Left to assign"}
            </p>
            <p className="tabular mt-1 text-[2.5rem] leading-none font-bold tracking-[-0.045em] sm:text-[3.25rem]">
              <Money
                value={summary.remaining}
                className={overAllocated ? "text-destructive" : "text-gold-bright"}
              />
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              of <Money value={summary.income} className="text-foreground" /> income this month
            </p>
          </div>

          <div className="mt-6">
            <AllocationBar summary={summary} />
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <AddTransactionButton />
            <SummaryExplainer summary={summary} />
          </div>
        </div>

        <figure className="flex items-center gap-5 border-t border-sidebar-border pt-6 lg:flex-col lg:justify-center lg:gap-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <BudgetGauge used={used} className="size-[132px] sm:size-[172px]" />
          <figcaption className="min-w-0 text-sm lg:text-center">
            <span className="block text-[10.5px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Budget used
            </span>
            {used !== null ? (
              <>
                <span className="mt-1 block">
                  <Money value={summary.spent} className="font-semibold text-foreground" />{" "}
                  <span className="text-muted-foreground">
                    of <Money value={plannedTotal} />
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {planLeft >= 0 ? (
                    <>
                      <Money value={planLeft} /> still in the plan
                    </>
                  ) : (
                    <>
                      Over by <Money value={-planLeft} className="text-destructive" />
                    </>
                  )}
                </span>
              </>
            ) : (
              <span className="mt-1 block text-muted-foreground">No budget for this month</span>
            )}
            <Link
              href={`/budget?m=${toMonthKey(month)}`}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gold-ink transition-colors hover:text-gold-bright"
            >
              {used !== null ? "Review budget" : "Set a budget"} <ArrowRight className="size-3.5" />
            </Link>
          </figcaption>
        </figure>
      </div>
    </HeroFrame>
  );
}

/** The hero while its data loads: the real month title, placeholders for the figures. */
export function MonthHeroSkeleton({ month }: { month: Date }) {
  return (
    <HeroFrame month={month} busy>
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-0">
        <div className="min-w-0 lg:pr-10">
          <HeroTitle month={month} />
          <Skeleton className="mt-3 h-3.5 w-72 max-w-full" />
          <Skeleton className="mt-9 h-2.5 w-24" />
          <Skeleton className="mt-3 h-12 w-64 max-w-full" />
          <Skeleton className="mt-3 h-3.5 w-48" />
          <Skeleton className="mt-7 h-3 w-full rounded-full" />
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-7 h-10 w-44 rounded-lg" />
        </div>
        <div className="flex items-center gap-5 border-t border-sidebar-border pt-6 lg:flex-col lg:justify-center lg:gap-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <Skeleton className="size-[132px] rounded-full sm:size-[172px]" />
          <div className="space-y-2 lg:flex lg:flex-col lg:items-center">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-3.5 w-36" />
          </div>
        </div>
      </div>
    </HeroFrame>
  );
}

/** The ink panel and its lighting, shared by the hero and its skeleton. */
function HeroFrame({
  month,
  busy = false,
  children,
}: {
  month: Date;
  busy?: boolean;
  children: React.ReactNode;
}) {
  return (
    // `dark` keeps the hero in ink on both themes, like the sidebar.
    <section
      aria-label={`${formatMonthLabel(month)} overview`}
      aria-busy={busy || undefined}
      className="dark relative isolate overflow-hidden rounded-3xl border border-sidebar-border bg-sidebar text-foreground shadow-lift"
    >
      {/* Gradients, not blur filters: they cost nothing to repaint while scrolling. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(42rem_30rem_at_0%_0%,color-mix(in_oklch,var(--primary)_30%,transparent),transparent_70%),radial-gradient(34rem_26rem_at_100%_100%,color-mix(in_oklch,var(--gold)_14%,transparent),transparent_70%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-ledger" />
      {children}
    </section>
  );
}

/** The folio line and month title — known before any data arrives. */
function HeroTitle({ month }: { month: Date }) {
  const folio = String(month.getUTCMonth() + 1).padStart(2, "0");

  return (
    <>
      <p className="flex items-center gap-2.5 text-[10.5px] font-semibold tracking-[0.22em] text-gold-ink uppercase">
        <span aria-hidden className="gold-rule h-px w-7" />
        Folio {folio} · Monthly ledger
      </p>
      <h1 className="mt-3 text-[2rem] leading-[1.05] font-semibold tracking-[-0.035em] sm:text-[2.5rem]">
        <AccentTitle title={formatMonthLabel(month)} italic={false} />
      </h1>
    </>
  );
}
