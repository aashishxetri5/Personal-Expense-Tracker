"use server";

import { z } from "zod";

import { nextSortOrder, parseInput, revalidateFinance, toActionError } from "@/lib/actions/helpers";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/db/user";
import { parseDateKey } from "@/lib/month";
import { actionError, actionOk, cuidSchema, type ActionResult } from "@/lib/validations/common";
import {
  archiveFutureFundSchema,
  futureFundInputSchema,
  updateFutureFundSchema,
} from "@/lib/validations/planning";

const idSchema = z.object({ id: cuidSchema });

/**
 * Creates a sinking fund and, optionally, the budget category that fronts it.
 *
 * @param input - Unvalidated fund fields from the form.
 * @returns The new fund id, or a failure.
 */
export async function createFutureFund(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(futureFundInputSchema, input);
  if (!parsed.ok) return parsed.result;

  const { createCategory: withCategory, nextDueDate, ...fields } = parsed.data;

  try {
    const userId = await getCurrentUserId();
    const sortOrder = await nextSortOrder(() =>
      prisma.futureFund.findFirst({
        where: { userId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      }),
    );

    const fund = await prisma.$transaction(async (tx) => {
      const created = await tx.futureFund.create({
        data: { ...fields, nextDueDate: parseDateKey(nextDueDate), userId, sortOrder },
      });

      if (withCategory) {
        await tx.category.create({
          data: {
            userId,
            name: created.name,
            kind: "FUTURE_FUND",
            color: created.color,
            icon: created.icon,
            sortOrder: 50 + sortOrder,
            futureFundId: created.id,
          },
        });
      }

      return created;
    });

    revalidateFinance();
    return actionOk({ id: fund.id });
  } catch (error) {
    return toActionError(error, "Could not create the fund.");
  }
}

/**
 * Updates a fund and keeps its linked budget category in step.
 *
 * @param input - `{ id, data }` where data holds the fund fields.
 * @returns The fund id, or a failure.
 */
export async function updateFutureFund(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(updateFutureFundSchema, input);
  if (!parsed.ok) return parsed.result;

  const { createCategory: _unused, nextDueDate, ...fields } = parsed.data.data;

  try {
    const userId = await getCurrentUserId();
    const result = await prisma.futureFund.updateMany({
      where: { id: parsed.data.id, userId },
      data: { ...fields, nextDueDate: parseDateKey(nextDueDate) },
    });
    if (result.count === 0) return actionError("That fund no longer exists.");

    await prisma.category.updateMany({
      where: { futureFundId: parsed.data.id, userId },
      data: { name: fields.name, color: fields.color, icon: fields.icon },
    });

    revalidateFinance();
    return actionOk({ id: parsed.data.id });
  } catch (error) {
    return toActionError(error, "Could not update the fund.");
  }
}

/**
 * Archives or restores a fund together with its budget category.
 *
 * @param input - `{ id, archived }`.
 * @returns The fund id, or a failure.
 */
export async function archiveFutureFund(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(archiveFutureFundSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    const archivedAt = parsed.data.archived ? new Date() : null;

    await prisma.futureFund.updateMany({ where: { id: parsed.data.id, userId }, data: { archivedAt } });
    await prisma.category.updateMany({
      where: { futureFundId: parsed.data.id, userId },
      data: { archivedAt },
    });

    revalidateFinance();
    return actionOk({ id: parsed.data.id });
  } catch (error) {
    return toActionError(error, "Could not archive the fund.");
  }
}

/**
 * Deletes a fund, or archives it when transactions still reference it so the
 * balances of past months stay explainable.
 *
 * @param input - `{ id }`.
 * @returns Whether the fund was archived instead of deleted.
 */
export async function deleteFutureFund(input: unknown): Promise<ActionResult<{ archived: boolean }>> {
  const parsed = parseInput(idSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    const fund = await prisma.futureFund.findFirst({ where: { id: parsed.data.id, userId } });
    if (!fund) return actionError("That fund no longer exists.");

    const used = await prisma.transaction.count({ where: { futureFundId: fund.id } });
    if (used > 0) {
      const archivedAt = new Date();
      await prisma.futureFund.update({ where: { id: fund.id }, data: { archivedAt } });
      await prisma.category.updateMany({ where: { futureFundId: fund.id }, data: { archivedAt } });
      revalidateFinance();
      return actionOk({ archived: true });
    }

    await prisma.$transaction([
      prisma.category.deleteMany({ where: { futureFundId: fund.id, userId } }),
      prisma.futureFund.delete({ where: { id: fund.id } }),
    ]);

    revalidateFinance();
    return actionOk({ archived: false });
  } catch (error) {
    return toActionError(error, "Could not delete the fund.");
  }
}
