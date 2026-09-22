"use server";

import { parseInput, revalidateFinance, toActionError } from "@/lib/actions/helpers";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/db/user";
import { parseMonthKey } from "@/lib/month";
import { actionOk, type ActionResult } from "@/lib/validations/common";
import { deleteNetWorthSchema, saveNetWorthSchema } from "@/lib/validations/planning";

/**
 * Saves the snapshot for one month, replacing its entries wholesale so a
 * removed asset cannot linger.
 *
 * @param input - `{ month, note, entries }` for a single month.
 * @returns The month key that was written, or a failure.
 */
export async function saveNetWorthSnapshot(input: unknown): Promise<ActionResult<{ month: string }>> {
  const parsed = parseInput(saveNetWorthSchema, input);
  if (!parsed.ok) return parsed.result;

  const month = parseMonthKey(parsed.data.month);

  try {
    const userId = await getCurrentUserId();

    await prisma.$transaction(async (tx) => {
      const snapshot = await tx.netWorthSnapshot.upsert({
        where: { userId_month: { userId, month } },
        create: { userId, month, note: parsed.data.note },
        update: { note: parsed.data.note },
      });

      await tx.netWorthEntry.deleteMany({ where: { snapshotId: snapshot.id } });
      await tx.netWorthEntry.createMany({
        data: parsed.data.entries.map((entry, index) => ({
          snapshotId: snapshot.id,
          label: entry.label,
          kind: entry.kind,
          amount: entry.amount,
          sortOrder: index,
        })),
      });
    });

    revalidateFinance();
    return actionOk({ month: parsed.data.month });
  } catch (error) {
    return toActionError(error, "Could not save the snapshot.");
  }
}

/**
 * Removes one month's snapshot, leaving every other month untouched.
 *
 * @param input - `{ month }`.
 * @returns The month key that was removed, or a failure.
 */
export async function deleteNetWorthSnapshot(input: unknown): Promise<ActionResult<{ month: string }>> {
  const parsed = parseInput(deleteNetWorthSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    await prisma.netWorthSnapshot.deleteMany({
      where: { userId, month: parseMonthKey(parsed.data.month) },
    });

    revalidateFinance();
    return actionOk({ month: parsed.data.month });
  } catch (error) {
    return toActionError(error, "Could not delete the snapshot.");
  }
}
