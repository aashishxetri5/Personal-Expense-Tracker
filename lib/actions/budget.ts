"use server";

import { parseInput, revalidateFinance, toActionError } from "@/lib/actions/helpers";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/db/user";
import { parseMonthKey } from "@/lib/month";
import { actionError, actionOk, type ActionResult } from "@/lib/validations/common";
import { copyBudgetSchema, saveBudgetSchema } from "@/lib/validations/planning";

/**
 * Saves one month's plan. The write is scoped to a single MonthlyBudget row, so
 * editing October cannot reach September — they are different rows.
 *
 * @param input - The month, income target, note and budget lines.
 * @returns The month key that was written, or a failure.
 */
export async function saveBudget(input: unknown): Promise<ActionResult<{ month: string }>> {
  const parsed = parseInput(saveBudgetSchema, input);
  if (!parsed.ok) return parsed.result;

  const { month, incomeTarget, note, items } = parsed.data;
  const monthDate = parseMonthKey(month);

  try {
    const userId = await getCurrentUserId();

    const categoryIds = items.map((item) => item.categoryId);
    if (categoryIds.length > 0) {
      const owned = await prisma.category.count({ where: { userId, id: { in: categoryIds } } });
      if (owned !== new Set(categoryIds).size) {
        return actionError("One of those categories no longer exists. Refresh and try again.");
      }
    }

    await prisma.$transaction(async (tx) => {
      const budget = await tx.monthlyBudget.upsert({
        where: { userId_month: { userId, month: monthDate } },
        create: { userId, month: monthDate, incomeTarget, note },
        update: { incomeTarget, note },
      });

      await tx.budgetItem.deleteMany({ where: { monthlyBudgetId: budget.id } });

      const payable = items.filter((item) => item.plannedAmount > 0);
      if (payable.length > 0) {
        await tx.budgetItem.createMany({
          data: payable.map((item) => ({
            monthlyBudgetId: budget.id,
            categoryId: item.categoryId,
            plannedAmount: item.plannedAmount,
          })),
        });
      }
    });

    revalidateFinance();
    return actionOk({ month });
  } catch (error) {
    return toActionError(error, "Could not save the budget.");
  }
}

/**
 * Duplicates one month's plan into another, leaving the source untouched.
 *
 * @param input -  month keys.
 * @returns The month key that was written, or a failure.
 */
export async function copyBudget(input: unknown): Promise<ActionResult<{ month: string }>> {
  const parsed = parseInput(copyBudgetSchema, input);
  if (!parsed.ok) return parsed.result;

  const from = parseMonthKey(parsed.data.from);
  const to = parseMonthKey(parsed.data.to);

  try {
    const userId = await getCurrentUserId();
    const source = await prisma.monthlyBudget.findUnique({
      where: { userId_month: { userId, month: from } },
      include: { items: true },
    });

    if (!source) return actionError(`There is no budget for ${parsed.data.from} to copy.`);

    await prisma.$transaction(async (tx) => {
      const target = await tx.monthlyBudget.upsert({
        where: { userId_month: { userId, month: to } },
        create: { userId, month: to, incomeTarget: source.incomeTarget, note: source.note },
        update: { incomeTarget: source.incomeTarget, note: source.note },
      });

      await tx.budgetItem.deleteMany({ where: { monthlyBudgetId: target.id } });
      if (source.items.length > 0) {
        await tx.budgetItem.createMany({
          data: source.items.map((item) => ({
            monthlyBudgetId: target.id,
            categoryId: item.categoryId,
            plannedAmount: item.plannedAmount,
          })),
        });
      }
    });

    revalidateFinance();
    return actionOk({ month: parsed.data.to });
  } catch (error) {
    return toActionError(error, "Could not copy the budget.");
  }
}

