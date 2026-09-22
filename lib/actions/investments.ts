"use server";

import { z } from "zod";

import { nextSortOrder, parseInput, revalidateFinance, toActionError } from "@/lib/actions/helpers";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/db/user";
import { actionError, actionOk, cuidSchema, type ActionResult } from "@/lib/validations/common";
import {
  archiveInvestmentSchema,
  investmentInputSchema,
  updateInvestmentSchema,
} from "@/lib/validations/planning";

const idSchema = z.object({ id: cuidSchema });

/**
 * Creates an investment, placing it at the end of the list.
 *
 * @param input - Unvalidated investment fields from the form.
 * @returns The new investment id, or a failure.
 */
export async function createInvestment(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(investmentInputSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    const sortOrder = await nextSortOrder(() =>
      prisma.investment.findFirst({
        where: { userId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      }),
    );

    const created = await prisma.investment.create({ data: { ...parsed.data, userId, sortOrder } });
    revalidateFinance();
    return actionOk({ id: created.id });
  } catch (error) {
    return toActionError(error, "Could not create the investment.");
  }
}

/**
 * Updates an investment the current user owns.
 *
 * @param input - `{ id, data }` where data holds the investment fields.
 * @returns The investment id, or a failure.
 */
export async function updateInvestment(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(updateInvestmentSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    const result = await prisma.investment.updateMany({
      where: { id: parsed.data.id, userId },
      data: parsed.data.data,
    });
    if (result.count === 0) return actionError("That investment no longer exists.");

    revalidateFinance();
    return actionOk({ id: parsed.data.id });
  } catch (error) {
    return toActionError(error, "Could not update the investment.");
  }
}

/**
 * Archives or restores an investment, keeping its contributions intact.
 *
 * @param input - `{ id, archived }`.
 * @returns The investment id, or a failure.
 */
export async function archiveInvestment(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(archiveInvestmentSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    await prisma.investment.updateMany({
      where: { id: parsed.data.id, userId },
      data: { archivedAt: parsed.data.archived ? new Date() : null },
    });

    revalidateFinance();
    return actionOk({ id: parsed.data.id });
  } catch (error) {
    return toActionError(error, "Could not archive the investment.");
  }
}

/**
 * Deletes an investment, or archives it when contributions reference it.
 *
 * @param input - `{ id }`.
 * @returns Whether the investment was archived instead of deleted.
 */
export async function deleteInvestment(input: unknown): Promise<ActionResult<{ archived: boolean }>> {
  const parsed = parseInput(idSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    const investment = await prisma.investment.findFirst({ where: { id: parsed.data.id, userId } });
    if (!investment) return actionError("That investment no longer exists.");

    const used = await prisma.transaction.count({ where: { investmentId: investment.id } });
    if (used > 0) {
      await prisma.investment.update({
        where: { id: investment.id },
        data: { archivedAt: new Date() },
      });
      revalidateFinance();
      return actionOk({ archived: true });
    }

    await prisma.investment.delete({ where: { id: investment.id } });
    revalidateFinance();
    return actionOk({ archived: false });
  } catch (error) {
    return toActionError(error, "Could not delete the investment.");
  }
}
