"use server";

import { parseInput, revalidateFinance, toActionError } from "@/lib/actions/helpers";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_BUDGET_PLAN } from "@/lib/db/defaults";
import { getCurrentUser, getCurrentUserId } from "@/lib/db/user";
import { parseMonthKey } from "@/lib/month";
import { actionError, actionOk, type ActionResult } from "@/lib/validations/common";
import { copyBudgetSchema, saveBudgetSchema } from "@/lib/validations/planning";

/**
 * Save the budget for one month.
 *
 * Writes are scoped to a single `MonthlyBudget` row, which is what makes
 * history immutable: editing October cannot reach September because they are
 * different rows. The item rewrite runs inside a transaction so a half-saved
 * budget can never be observed.
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

/** Duplicate one month's plan into another month, leaving the source untouched. */
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

/**
 * Seed a month's budget: copy the previous month if one exists, otherwise fall
 * back to the sensible starting plan. Never overwrites an existing budget.
 */
export async function startBudgetForMonth(monthKey: string): Promise<ActionResult<{ month: string }>> {
  const month = parseMonthKey(monthKey);

  try {
    const user = await getCurrentUser();
    const existing = await prisma.monthlyBudget.findUnique({
      where: { userId_month: { userId: user.id, month } },
    });
    if (existing) return actionOk({ month: monthKey });

    const previous = await prisma.monthlyBudget.findFirst({
      where: { userId: user.id, month: { lt: month } },
      orderBy: { month: "desc" },
      include: { items: true },
    });

    if (previous) {
      await prisma.monthlyBudget.create({
        data: {
          userId: user.id,
          month,
          incomeTarget: previous.incomeTarget,
          items: {
            create: previous.items.map((item) => ({
              categoryId: item.categoryId,
              plannedAmount: item.plannedAmount,
            })),
          },
        },
      });
    } else {
      const categories = await prisma.category.findMany({
        where: { userId: user.id, archivedAt: null, name: { in: Object.keys(DEFAULT_BUDGET_PLAN) } },
        select: { id: true, name: true },
      });

      await prisma.monthlyBudget.create({
        data: {
          userId: user.id,
          month,
          incomeTarget: user.defaultMonthlyIncome,
          items: {
            create: categories.map((category) => ({
              categoryId: category.id,
              plannedAmount: DEFAULT_BUDGET_PLAN[category.name] ?? 0,
            })),
          },
        },
      });
    }

    revalidateFinance();
    return actionOk({ month: monthKey });
  } catch (error) {
    return toActionError(error, "Could not create the budget.");
  }
}

export async function deleteBudget(monthKey: string): Promise<ActionResult<{ month: string }>> {
  const month = parseMonthKey(monthKey);

  try {
    const userId = await getCurrentUserId();
    await prisma.monthlyBudget.deleteMany({ where: { userId, month } });
    revalidateFinance();
    return actionOk({ month: monthKey });
  } catch (error) {
    return toActionError(error, "Could not delete the budget.");
  }
}
