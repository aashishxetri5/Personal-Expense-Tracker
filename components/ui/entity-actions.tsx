"use client";

import * as React from "react";
import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { runAction } from "@/lib/client/run-action";
import type { ActionResult } from "@/lib/validations/common";

export type EntityActionsProps = {
  /** Used in the menu label, the confirmation copy and the toasts. */
  name: string;
  archived: boolean;
  onEdit: () => void;
  archive: (archived: boolean) => Promise<ActionResult<unknown>>;
  /** Omit to hide Delete — for entities that may only be archived. */
  remove?: () => Promise<ActionResult<{ archived: boolean }>>;
  deleteDescription?: React.ReactNode;
};

/**
 * Edit / archive / delete menu shared by funds, goals, investments, categories
 * and payment methods, so all five behave and read identically.
 *
 * @param props - Entity name and state plus the three action callbacks.
 * @returns The actions menu with its confirmation dialog.
 */
export function EntityActions({
  name,
  archived,
  onEdit,
  archive,
  remove,
  deleteDescription,
}: EntityActionsProps) {
  const [confirming, setConfirming] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const toggleArchive = async () => {
    await runAction(() => archive(!archived), {
      success: archived ? `${name} restored` : `${name} archived`,
    });
  };

  const handleDelete = async () => {
    if (!remove) return;
    setPending(true);
    // Anything with history is archived rather than deleted, and the action
    // reports which happened so the toast can tell the truth.
    const data = await runAction(remove, {
      success: (result) =>
        result.archived ? `${name} has history, so it was archived instead` : `${name} deleted`,
    });
    setPending(false);
    if (data) setConfirming(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil /> Edit
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={toggleArchive}>
            {archived ? (
              <>
                <ArchiveRestore /> Restore
              </>
            ) : (
              <>
                <Archive /> Archive
              </>
            )}
          </DropdownMenuItem>

          {remove ? (
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {remove ? (
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          loading={pending}
          title={`Delete ${name}?`}
          description={
            deleteDescription ??
            "Records with history are archived instead, so your past months stay intact."
          }
          onConfirm={handleDelete}
        />
      ) : null}
    </>
  );
}
