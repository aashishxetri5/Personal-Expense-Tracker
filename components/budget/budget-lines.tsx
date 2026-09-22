"use client";

import * as React from "react";

import { Money } from "@/components/money";
import { Badge, ColorDot, EmptyState } from "@/components/ui/display";
import { Progress } from "@/components/ui/primitives";
import { useChartTheme } from "@/components/charts/chart-kit";
import type { BudgetLine } from "@/lib/calculations/budget";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

function toneFor(line: BudgetLine) {
  if (line.isOver) return "danger" as const;
  if (line.rawProgress > 85) return "warning" as const;
  return "default" as const;
}

/**
 * One budget line: planned against actual, with the over-budget case called out
 * clearly but without shouting. Carry-forward categories show what rolled in
 * from previous months, because their ceiling is not just this month's plan.
 */
export function BudgetLineRow({ line }: { line: BudgetLine }) {
  const theme = useChartTheme();

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="flex min-w-0 items-center gap-2">
          <ColorDot color={theme.series(line.color)} />
          <span className="truncate text-sm font-medium">{line.categoryName}</span>
          {line.carryForward ? (
            <Badge variant="outline" className="shrink-0">
              Rolls over
            </Badge>
          ) : null}
        </span>

        <span className="text-sm tabular">
          <Money value={line.actual} className="font-medium" />
          <span className="text-muted-foreground">
            {" / "}
            <Money value={line.available} />
          </span>
        </span>
      </div>

      <Progress value={line.progress} tone={toneFor(line)} className="mt-2 h-1.5" />

      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs">
        <span className="text-muted-foreground">
          {line.carriedIn !== 0 ? (
            <>
              <Money value={line.planned} /> allocated
              {" · "}
              <Money value={line.carriedIn} signed className={line.carriedIn < 0 ? "text-destructive" : ""} />{" "}
              carried in
            </>
          ) : (
            formatPercent(line.rawProgress, line.rawProgress % 1 === 0 ? 0 : 1) + " used"
          )}
        </span>

        {line.isOver ? (
          <span className="font-medium text-destructive">
            <Money value={line.overBy} signed /> over budget
          </span>
        ) : (
          <span className="text-muted-foreground">
            <Money value={line.remaining} /> left
          </span>
        )}
      </div>
    </li>
  );
}

export function BudgetLineList({
  lines,
  emptyAction,
  className,
}: {
  lines: BudgetLine[];
  emptyAction?: React.ReactNode;
  className?: string;
}) {
  if (lines.length === 0) {
    return (
      <EmptyState
        compact
        title="No budget lines yet"
        description="Set planned amounts to see how the month is tracking."
        action={emptyAction}
      />
    );
  }

  return (
    <ul className={cn("divide-y divide-border", className)}>
      {lines.map((line) => (
        <BudgetLineRow key={line.categoryId} line={line} />
      ))}
    </ul>
  );
}
