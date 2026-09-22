"use server";

import { z } from "zod";

import { nextSortOrder, parseInput, revalidateFinance, toActionError } from "@/lib/actions/helpers";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/db/user";
import { parseDateKey } from "@/lib/month";
import { actionError, actionOk, cuidSchema, type ActionResult } from "@/lib/validations/common";
import {
  archiveSavingsGoalSchema,
  savingsGoalInputSchema,
  updateSavingsGoalSchema,
} from "@/lib/validations/planning";

const idSchema = z.object({ id: cuidSchema });

/**
 * Creates a savings goal, placing it at the end of the list.
 *
 * @param input - Unvalidated goal fields from the form.
 * @returns The new goal id, or a failure.
 */
export async function createSavingsGoal(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(savingsGoalInputSchema, input);
  if (!parsed.ok) return parsed.result;

  const { targetDate, ...fields } = parsed.data;

  try {
    const userId = await getCurrentUserId();
    const sortOrder = await nextSortOrder(() =>
      prisma.savingsGoal.findFirst({
        where: { userId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      }),
    );

    const created = await prisma.savingsGoal.create({
      data: { ...fields, targetDate: parseDateKey(targetDate), userId, sortOrder },
    });

    revalidateFinance();
    return actionOk({ id: created.id });
  } catch (error) {
    return toActionError(error, "Could not create the goal.");
  }
}

/**
 * Updates a savings goal the current user owns.
 *
 * @param input - `{ id, data }` where data holds the goal fields.
 * @returns The goal id, or a failure.
 */
export async function updateSavingsGoal(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(updateSavingsGoalSchema, input);
  if (!parsed.ok) return parsed.result;

  const { targetDate, ...fields } = parsed.data.data;

  try {
    const userId = await getCurrentUserId();
    const result = await prisma.savingsGoal.updateMany({
      where: { id: parsed.data.id, userId },
      data: { ...fields, targetDate: parseDateKey(targetDate) },
    });
    if (result.count === 0) return actionError("That goal no longer exists.");

    revalidateFinance();
    return actionOk({ id: parsed.data.id });
  } catch (error) {
    return toActionError(error, "Could not update the goal.");
  }
}

/**
 * Archives or restores a savings goal, keeping its contributions intact.
 *
 * @param input - `{ id, archived }`.
 * @returns The goal id, or a failure.
 */
export async function archiveSavingsGoal(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(archiveSavingsGoalSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    await prisma.savingsGoal.updateMany({
      where: { id: parsed.data.id, userId },
      data: { archivedAt: parsed.data.archived ? new Date() : null },
    });

    revalidateFinance();
    return actionOk({ id: parsed.data.id });
  } catch (error) {
    return toActionError(error, "Could not archive the goal.");
  }
}

/**
 * Deletes a goal, or archives it when contributions reference it.
 *
 * @param input - `{ id }`.
 * @returns Whether the goal was archived instead of deleted.
 */
export async function deleteSavingsGoal(input: unknown): Promise<ActionResult<{ archived: boolean }>> {
  const parsed = parseInput(idSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    const goal = await prisma.savingsGoal.findFirst({ where: { id: parsed.data.id, userId } });
    if (!goal) return actionError("That goal no longer exists.");

    const used = await prisma.transaction.count({ where: { savingsGoalId: goal.id } });
    if (used > 0) {
      await prisma.savingsGoal.update({ where: { id: goal.id }, data: { archivedAt: new Date() } });
      revalidateFinance();
      return actionOk({ archived: true });
    }

    await prisma.savingsGoal.delete({ where: { id: goal.id } });
    revalidateFinance();
    return actionOk({ archived: false });
  } catch (error) {
    return toActionError(error, "Could not delete the goal.");
  }
}
