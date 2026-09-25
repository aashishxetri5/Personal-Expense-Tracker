"use client";

import { Info } from "lucide-react";

import { Money } from "@/components/money";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { MonthlySummary } from "@/lib/calculations/ledger";

/** Explains how the month's figures relate, so the definitions are never a mystery. */
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
