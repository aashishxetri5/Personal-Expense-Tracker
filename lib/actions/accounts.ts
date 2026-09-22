"use server";

import { nextSortOrder, parseInput, revalidateFinance, toActionError } from "@/lib/actions/helpers";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/db/user";
import { actionError, actionOk, type ActionResult } from "@/lib/validations/common";
import {
  accountInputSchema,
  archiveAccountSchema,
  updateAccountSchema,
} from "@/lib/validations/planning";

/**
 * Creates a payment method, placing it at the end of the list.
 *
 * @param input - Unvalidated account fields from the form.
 * @returns The new account id, or a failure.
 */
export async function createAccount(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(accountInputSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    const sortOrder = await nextSortOrder(() =>
      prisma.account.findFirst({
        where: { userId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      }),
    );

    const created = await prisma.account.create({ data: { ...parsed.data, userId, sortOrder } });
    revalidateFinance();
    return actionOk({ id: created.id });
  } catch (error) {
    return toActionError(error, "Could not create the payment method.");
  }
}

/**
 * Updates a payment method the current user owns.
 *
 * @param input - `{ id, data }` where data holds the account fields.
 * @returns The account id, or a failure.
 */
export async function updateAccount(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(updateAccountSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    const result = await prisma.account.updateMany({
      where: { id: parsed.data.id, userId },
      data: parsed.data.data,
    });
    if (result.count === 0) return actionError("That payment method no longer exists.");

    revalidateFinance();
    return actionOk({ id: parsed.data.id });
  } catch (error) {
    return toActionError(error, "Could not update the payment method.");
  }
}

/**
 * Archives or restores a payment method, keeping past transactions labelled.
 *
 * @param input - `{ id, archived }`.
 * @returns The account id, or a failure.
 */
export async function archiveAccount(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(archiveAccountSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    await prisma.account.updateMany({
      where: { id: parsed.data.id, userId },
      data: { archivedAt: parsed.data.archived ? new Date() : null },
    });
    revalidateFinance();
    return actionOk({ id: parsed.data.id });
  } catch (error) {
    return toActionError(error, "Could not archive the payment method.");
  }
}
