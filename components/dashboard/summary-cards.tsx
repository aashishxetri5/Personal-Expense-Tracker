"use client";

import * as React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Info,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Money } from "@/components/money";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import type { MonthlySummary } from "@/lib/calculations/ledger";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type Metric = {
  key: string;
  label: string;
  value: number;
  icon: typeof Wallet;
  caption: React.ReactNode;
  accent: string;
  tone?: "positive" | "negative" | "none";
};

/**
 * The five headline figures. Every rupee of income lands in exactly one of
 * Spent, Invested, Saved or Remaining, so the cards are a partition.
 *
 * @param props - The month's summary and its planned budget total.
 * @returns The summary card strip.
 */
export function SummaryCards({
  summary,
  plannedTotal,
  className,
}: {
  summary: MonthlySummary;
  plannedTotal: number;
  className?: string;
}) {
  const budgetUsed = plannedTotal > 0 ? (summary.spent / plannedTotal) * 100 : 0;

  const metrics: Metric[] = [
    {
      key: "income",
      label: "Income",
      value: summary.income,
      icon: ArrowDownRight,
      caption: "Received this month",
      accent: "text-[var(--success)]",
    },
    {
      key: "spent",
      label: "Spent",
      value: summary.spent,
      icon: ArrowUpRight,
      caption:
        plannedTotal > 0 ? (
          <span className={cn(budgetUsed > 100 && "text-destructive")}>
            {formatPercent(budgetUsed)} of budget
          </span>
        ) : (
          "No budget set"
        ),
      accent: "text-foreground",
    },
    {
      key: "saved",
      label: "Saved",
      value: summary.saved,
      icon: PiggyBank,
      caption: "Into savings goals",
      accent: "text-foreground",
    },
    {
      key: "invested",
      label: "Invested",
      value: summary.investments,
      icon: TrendingUp,
      caption: "Not counted as spending",
      accent: "text-foreground",
    },
    {
      key: "remaining",
      label: "Remaining",
      value: summary.remaining,
      icon: Wallet,
      caption: summary.remaining < 0 ? "Over-allocated" : "Yet to be assigned",
      accent: "text-foreground",
      tone: summary.remaining < 0 ? "negative" : "none",
    },
  ];

  return (
    <section
      aria-label="Month summary"
      className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-5", className)}
    >
      {metrics.map((metric, index) => (
        <Card
          key={metric.key}
          className="animate-[rise_0.24s_cubic-bezier(0.16,1,0.3,1)_both] p-4"
          style={{ animationDelay: `${index * 35}ms` }}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              {metric.label}
            </p>
            <metric.icon className={cn("size-3.5 shrink-0", metric.accent)} aria-hidden />
          </div>

          <p className="mt-2 text-xl font-semibold tracking-tight sm:text-[22px]">
            <Money value={metric.value} tone={metric.tone === "negative" ? "negative" : "none"} />
          </p>

          <p className="mt-1 text-xs text-muted-foreground">{metric.caption}</p>

          {metric.key === "spent" && plannedTotal > 0 ? (
            <Progress
              value={budgetUsed}
              tone={budgetUsed > 100 ? "danger" : budgetUsed > 85 ? "warning" : "default"}
              className="mt-3 h-1.5"
            />
          ) : null}
        </Card>
      ))}
    </section>
  );
}

/** Explains how the five cards relate, so the definitions are never a mystery. */
export function SummaryExplainer({ summary }: { summary: MonthlySummary }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Info className="size-3.5" />
          How these add up
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <p className="text-sm font-medium">Every rupee is counted once</p>
        <dl className="mt-3 space-y-2 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Everyday spending</dt>
            <dd>
              <Money value={summary.expenses} />
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Into future funds</dt>
            <dd>
              <Money value={summary.fundContributions} />
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-border pt-2 font-medium">
            <dt>Spent</dt>
            <dd>
              <Money value={summary.spent} />
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Invested</dt>
            <dd>
              <Money value={summary.investments} />
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Saved into goals</dt>
            <dd>
              <Money value={summary.saved} />
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-border pt-2 font-medium">
            <dt>Remaining</dt>
            <dd>
              <Money value={summary.remaining} tone="auto" />
            </dd>
          </div>
        </dl>

        {summary.fundExpenses > 0 || summary.goalWithdrawals > 0 ? (
          <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
            A further{" "}
            <Money
              value={summary.fundExpenses + summary.goalWithdrawals}
              className="font-medium text-foreground"
            />{" "}
            was paid out of reserves. It is not charged again here — that money was
            already accounted for when you set it aside.
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
