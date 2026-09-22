"use server";

import { parseInput, revalidateFinance, toActionError } from "@/lib/actions/helpers";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/db/user";
import { actionOk, type ActionResult } from "@/lib/validations/common";
import { deleteAllDataSchema, settingsSchema } from "@/lib/validations/planning";

export async function saveSettings(input: unknown): Promise<ActionResult<{ ok: true }>> {
  const parsed = parseInput(settingsSchema, input);
  if (!parsed.ok) return parsed.result;

  const { name, ...settings } = parsed.data;

  try {
    const userId = await getCurrentUserId();
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { name } }),
      prisma.userSettings.upsert({
        where: { userId },
        create: { userId, ...settings },
        update: settings,
      }),
    ]);

    revalidateFinance();
    return actionOk({ ok: true } as const);
  } catch (error) {
    return toActionError(error, "Could not save your settings.");
  }
}

/**
 * Wipes financial data. A full wipe keeps categories, accounts, funds and goals
 * so starting over does not mean rebuilding the whole setup.
 *
 * @param input - Typed confirmation, and `demoOnly` to remove only seeded rows.
 * @returns How many records were deleted, or a failure.
 */
export async function deleteAllData(input: unknown): Promise<ActionResult<{ deleted: number }>> {
  const parsed = parseInput(deleteAllDataSchema, input);
  if (!parsed.ok) return parsed.result;

  const demoOnly = parsed.data.demoOnly;
  const scope = demoOnly ? { isDemo: true } : {};

  try {
    const userId = await getCurrentUserId();

    const result = await prisma.$transaction(async (tx) => {
      const transactions = await tx.transaction.deleteMany({ where: { userId, ...scope } });
      const budgets = await tx.monthlyBudget.deleteMany({ where: { userId, ...scope } });
      const snapshots = await tx.netWorthSnapshot.deleteMany({ where: { userId, ...scope } });

      if (demoOnly) {
        await tx.futureFund.deleteMany({ where: { userId, isDemo: true } });
        await tx.savingsGoal.deleteMany({ where: { userId, isDemo: true } });
        await tx.investment.deleteMany({ where: { userId, isDemo: true } });
      }

      await tx.userSettings.update({ where: { userId }, data: { demoDataLoaded: false } });

      return transactions.count + budgets.count + snapshots.count;
    });

    revalidateFinance();
    return actionOk({ deleted: result });
  } catch (error) {
    return toActionError(error, "Could not delete your data.");
  }
}
