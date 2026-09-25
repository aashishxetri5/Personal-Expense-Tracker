"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";

import { useChartTheme } from "@/components/charts/chart-kit";
import { InvestmentDialog, NewInvestmentButton } from "@/components/investments/investment-dialog";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { ColorDot } from "@/components/ui/color-dot";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityActions } from "@/components/ui/entity-actions";
import { archiveInvestment, deleteInvestment } from "@/lib/actions/investments";
import { INVESTMENT_KIND_LABELS } from "@/lib/labels";
import type { InvestmentWithTotals } from "@/lib/types";

/**
 * Edit/archive/delete menu for one investment, with its edit dialog.
 *
 * @param props - The investment the menu acts on.
 * @returns The actions menu.
 */
function InvestmentActions({ investment }: { investment: InvestmentWithTotals }) {
  const [editing, setEditing] = React.useState(false);

  return (
    <>
      <EntityActions
        name={investment.name}
        archived={investment.archived}
        onEdit={() => setEditing(true)}
        archive={(archived) => archiveInvestment({ id: investment.id, archived })}
        remove={() => deleteInvestment({ id: investment.id })}
        deleteDescription="Investments with contributions are archived instead, so your history stays intact."
      />
      <InvestmentDialog
        investment={editing ? investment : null}
        open={editing}
        onOpenChange={setEditing}
      />
    </>
  );
}

/**
 * One investment: what has gone in overall, this year and this month.
 *
 * @param props - The investment with its aggregated totals.
 * @returns The investment card.
 */
function InvestmentCard({ investment }: { investment: InvestmentWithTotals }) {
  const theme = useChartTheme();

  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ColorDot color={theme.series(investment.color)} />
            <span className="truncate">{investment.name}</span>
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{INVESTMENT_KIND_LABELS[investment.kind]}</Badge>
            {investment.provider ? <span className="truncate">{investment.provider}</span> : null}
          </p>
        </div>
        <InvestmentActions investment={investment} />
      </header>

      <p className="mt-4 text-2xl font-semibold tracking-tight">
        <Money value={investment.totalInvested} />
      </p>
      <p className="text-xs text-muted-foreground">total invested</p>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-xs">
        <div>
          <dt className="text-muted-foreground">This month</dt>
          <dd className="mt-0.5 font-medium">
            <Money value={investment.investedThisMonth} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">This year</dt>
          <dd className="mt-0.5 font-medium">
            <Money value={investment.investedThisYear} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Monthly plan</dt>
          <dd className="mt-0.5 font-medium">
            <Money value={investment.monthlyContribution} />
          </dd>
        </div>
      </dl>

      {investment.notes ? (
        <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
          {investment.notes}
        </p>
      ) : null}
    </article>
  );
}

/**
 * Grid of investments, or the prompt to add the first one.
 *
 * @param props - The investments to render, with their totals.
 * @returns The investment grid or an empty state.
 */
export function InvestmentGrid({ investments }: { investments: InvestmentWithTotals[] }) {
  if (investments.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No investments yet"
        description="Add your SIP or any other plan you pay into, then record contributions as investment transactions."
        action={<NewInvestmentButton size="default" />}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {investments.map((investment) => (
        <InvestmentCard key={investment.id} investment={investment} />
      ))}
    </div>
  );
}
