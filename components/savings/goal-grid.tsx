"use client";

import * as React from "react";
import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { GoalCard } from "@/components/savings/goal-progress";
import { GoalDialog, NewGoalButton } from "@/components/savings/goal-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/display";
import {
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/primitives";
import { archiveSavingsGoal, deleteSavingsGoal } from "@/lib/actions/planning";
import type { SavingsGoalWithProgress } from "@/lib/types";

function GoalActions({ goal }: { goal: SavingsGoalWithProgress }) {
  const [editing, setEditing] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const toggleArchive = async () => {
    const result = await archiveSavingsGoal({ id: goal.id, archived: !goal.archived });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(goal.archived ? `${goal.name} restored` : `${goal.name} archived`);
  };

  const handleDelete = async () => {
    setPending(true);
    const result = await deleteSavingsGoal({ id: goal.id });
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setConfirming(false);
    toast.success(
      result.data.archived
        ? `${goal.name} has contributions, so it was archived instead`
        : `${goal.name} deleted`,
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${goal.name}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={toggleArchive}>
            {goal.archived ? (
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

      <GoalDialog goal={goal} open={editing} onOpenChange={setEditing} />

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        loading={pending}
        title={`Delete ${goal.name}?`}
        description="Goals with contributions are archived instead, so your history stays intact."
        onConfirm={handleDelete}
      />
    </>
  );
}

export function GoalGrid({ goals }: { goals: SavingsGoalWithProgress[] }) {
  if (goals.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No savings goals yet"
        description="Name what you are saving for, set a target, and watch it fill up."
        action={<NewGoalButton size="default" />}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} actions={<GoalActions goal={goal} />} />
      ))}
    </div>
  );
}
