"use client";

import * as React from "react";
import { PiggyBank } from "lucide-react";

import { FundCard } from "@/components/funds/fund-progress";
import { FundDialog, NewFundButton } from "@/components/funds/fund-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityActions } from "@/components/ui/entity-actions";
import { archiveFutureFund, deleteFutureFund } from "@/lib/actions/funds";
import type { FutureFundWithBalance } from "@/lib/types";

/**
 * Edit/archive/delete menu for one fund, with the edit dialog it opens.
 *
 * @param props - The fund the menu acts on.
 * @returns The actions menu.
 */
function FundActions({ fund }: { fund: FutureFundWithBalance }) {
  const [editing, setEditing] = React.useState(false);

  return (
    <>
      <EntityActions
        name={fund.name}
        archived={fund.archived}
        onEdit={() => setEditing(true)}
        archive={(archived) => archiveFutureFund({ id: fund.id, archived })}
        remove={() => deleteFutureFund({ id: fund.id })}
        deleteDescription="Funds with transactions are archived instead, so your history stays intact."
      />
      <FundDialog fund={editing ? fund : null} open={editing} onOpenChange={setEditing} />
    </>
  );
}

/**
 * Grid of sinking funds, or the prompt to create the first one.
 *
 * @param props - The funds to render, with their current balances.
 * @returns The fund grid or an empty state.
 */
export function FundGrid({ funds }: { funds: FutureFundWithBalance[] }) {
  if (funds.length === 0) {
    return (
      <EmptyState
        icon={PiggyBank}
        title="No future funds yet"
        description="Sinking funds smooth out the bills that do not arrive every month — servicing, festivals, a new phone battery."
        action={<NewFundButton size="default" />}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {funds.map((fund) => (
        <FundCard
          key={fund.id}
          fund={fund}
          className={fund.archived ? "opacity-60" : undefined}
          actions={<FundActions fund={fund} />}
        />
      ))}
    </div>
  );
}
