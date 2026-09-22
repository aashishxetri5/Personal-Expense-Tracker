"use client";

import * as React from "react";
import { Archive, ArchiveRestore, MoreHorizontal, Pencil, PiggyBank, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FundCard } from "@/components/funds/fund-progress";
import { FundDialog, NewFundButton } from "@/components/funds/fund-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/display";
import {
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/primitives";
import { archiveFutureFund, deleteFutureFund } from "@/lib/actions/planning";
import type { FutureFundWithBalance } from "@/lib/types";

function FundActions({ fund }: { fund: FutureFundWithBalance }) {
  const [editing, setEditing] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const toggleArchive = async () => {
    const result = await archiveFutureFund({ id: fund.id, archived: !fund.archived });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(fund.archived ? `${fund.name} restored` : `${fund.name} archived`);
  };

  const handleDelete = async () => {
    setPending(true);
    const result = await deleteFutureFund({ id: fund.id });
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setConfirming(false);
    toast.success(
      result.data.archived
        ? `${fund.name} has history, so it was archived instead of deleted`
        : `${fund.name} deleted`,
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${fund.name}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={toggleArchive}>
            {fund.archived ? (
              <>
                <ArchiveRestore /> Restore
              </>
            ) : (
              <>
                <Archive /> Archive
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FundDialog fund={fund} open={editing} onOpenChange={setEditing} />

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        loading={pending}
        title={`Delete the ${fund.name} fund?`}
        description="Funds with transactions are archived instead, so your history stays intact."
        onConfirm={handleDelete}
      />
    </>
  );
}

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
