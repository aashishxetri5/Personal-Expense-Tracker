"use client";

import * as React from "react";
import { Target } from "lucide-react";

import { GoalCard } from "@/components/savings/goal-progress";
import { GoalDialog, NewGoalButton } from "@/components/savings/goal-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityActions } from "@/components/ui/entity-actions";
import { archiveSavingsGoal, deleteSavingsGoal } from "@/lib/actions/goals";
import type { SavingsGoalWithProgress } from "@/lib/types";

/**
 * Edit/archive/delete menu for one goal, with the edit dialog it opens.
 *
 * @param props - The goal the menu acts on.
 * @returns The actions menu.
 */
function GoalActions({ goal }: { goal: SavingsGoalWithProgress }) {
  const [editing, setEditing] = React.useState(false);

  return (
    <>
      <EntityActions
        name={goal.name}
        archived={goal.archived}
        onEdit={() => setEditing(true)}
        archive={(archived) => archiveSavingsGoal({ id: goal.id, archived })}
        remove={() => deleteSavingsGoal({ id: goal.id })}
        deleteDescription="Goals with contributions are archived instead, so your history stays intact."
      />
      <GoalDialog goal={editing ? goal : null} open={editing} onOpenChange={setEditing} />
    </>
  );
}

/**
 * Grid of savings goals, or the prompt to create the first one.
 *
 * @param props - The goals to render, with their progress.
 * @returns The goal grid or an empty state.
 */
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
