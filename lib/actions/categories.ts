"use server";

import { nextSortOrder, parseInput, revalidateFinance, toActionError } from "@/lib/actions/helpers";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/db/user";
import { actionError, actionOk, cuidSchema, type ActionResult } from "@/lib/validations/common";
import {
  archiveCategorySchema,
  categoryInputSchema,
  updateCategorySchema,
} from "@/lib/validations/planning";
import { z } from "zod";

const idSchema = z.object({ id: cuidSchema });

/**
 * Creates a category, placing it at the end of the list.
 *
 * @param input - Unvalidated category fields from the form.
 * @returns The new category id, or a validation/database failure.
 */
export async function createCategory(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(categoryInputSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    const sortOrder = await nextSortOrder(() =>
      prisma.category.findFirst({
        where: { userId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      }),
    );

    const created = await prisma.category.create({ data: { ...parsed.data, userId, sortOrder } });
    revalidateFinance();
    return actionOk({ id: created.id });
  } catch (error) {
    return toActionError(error, "Could not create the category.");
  }
}

/**
 * Updates a category the current user owns.
 *
 * @param input - `{ id, data }` where data holds the category fields.
 * @returns The category id, or a failure.
 */
export async function updateCategory(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(updateCategorySchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    const result = await prisma.category.updateMany({
      where: { id: parsed.data.id, userId },
      data: parsed.data.data,
    });
    if (result.count === 0) return actionError("That category no longer exists.");

    revalidateFinance();
    return actionOk({ id: parsed.data.id });
  } catch (error) {
    return toActionError(error, "Could not update the category.");
  }
}

/**
 * Archives or restores a category without touching its history.
 *
 * @param input - `{ id, archived }`.
 * @returns The category id, or a failure.
 */
export async function archiveCategory(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(archiveCategorySchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    await prisma.category.updateMany({
      where: { id: parsed.data.id, userId },
      data: { archivedAt: parsed.data.archived ? new Date() : null },
    });
    revalidateFinance();
    return actionOk({ id: parsed.data.id });
  } catch (error) {
    return toActionError(error, "Could not archive the category.");
  }
}

/**
 * Deletes a category, or archives it when transactions or budgets still refer
 * to it so past months keep their labels.
 *
 * @param input - `{ id }`.
 * @returns Whether the category was archived instead of deleted.
 */
export async function deleteCategory(input: unknown): Promise<ActionResult<{ archived: boolean }>> {
  const parsed = parseInput(idSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    const category = await prisma.category.findFirst({ where: { id: parsed.data.id, userId } });
    if (!category) return actionError("That category no longer exists.");
    if (category.isSystem) return actionError("Built-in categories can be archived but not deleted.");

    const [transactions, budgetItems] = await Promise.all([
      prisma.transaction.count({ where: { categoryId: category.id } }),
      prisma.budgetItem.count({ where: { categoryId: category.id } }),
    ]);

    if (transactions > 0 || budgetItems > 0) {
      await prisma.category.update({ where: { id: category.id }, data: { archivedAt: new Date() } });
      revalidateFinance();
      return actionOk({ archived: true });
    }

    await prisma.category.delete({ where: { id: category.id } });
    revalidateFinance();
    return actionOk({ archived: false });
  } catch (error) {
    return toActionError(error, "Could not delete the category.");
  }
}
