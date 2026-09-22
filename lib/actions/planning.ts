"use server";

import { parseInput, revalidateFinance, toActionError } from "@/lib/actions/helpers";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/db/user";
import { parseDateKey, parseMonthKey } from "@/lib/month";
import { actionError, actionOk, type ActionResult } from "@/lib/validations/common";
import {
  accountInputSchema,
  archiveAccountSchema,
  archiveCategorySchema,
  archiveFutureFundSchema,
  archiveInvestmentSchema,
  archiveSavingsGoalSchema,
  categoryInputSchema,
  futureFundInputSchema,
  investmentInputSchema,
  savingsGoalInputSchema,
  saveNetWorthSchema,
  deleteNetWorthSchema,
  updateAccountSchema,
  updateCategorySchema,
  updateFutureFundSchema,
  updateInvestmentSchema,
  updateSavingsGoalSchema,
} from "@/lib/validations/planning";
import { cuidSchema } from "@/lib/validations/common";
import { z } from "zod";

const idSchema = z.object({ id: cuidSchema });

async function nextSortOrder(model: "category" | "futureFund" | "savingsGoal" | "investment" | "account", userId: string) {
  const delegate = prisma[model] as {
    findFirst: (args: unknown) => Promise<{ sortOrder: number } | null>;
  };
  const last = await delegate.findFirst({
    where: { userId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return (last?.sortOrder ?? -1) + 1;
}

// --- Categories ------------------------------------------------------------

export async function createCategory(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(categoryInputSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    const created = await prisma.category.create({
      data: { ...parsed.data, userId, sortOrder: await nextSortOrder("category", userId) },
    });
    revalidateFinance();
    return actionOk({ id: created.id });
  } catch (error) {
    return toActionError(error, "Could not create the category.");
  }
}

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
 * Categories are only deletable when nothing references them. Anything with
 * history is archived instead, so past months keep their labels.
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

// --- Accounts --------------------------------------------------------------

export async function createAccount(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(accountInputSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    const created = await prisma.account.create({
      data: { ...parsed.data, userId, sortOrder: await nextSortOrder("account", userId) },
    });
    revalidateFinance();
    return actionOk({ id: created.id });
  } catch (error) {
    return toActionError(error, "Could not create the payment method.");
  }
}

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

// --- Future funds ----------------------------------------------------------

export async function createFutureFund(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(futureFundInputSchema, input);
  if (!parsed.ok) return parsed.result;

  const { createCategory: withCategory, nextDueDate, ...fields } = parsed.data;

  try {
    const userId = await getCurrentUserId();
    const sortOrder = await nextSortOrder("futureFund", userId);

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

export async function updateFutureFund(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(updateFutureFundSchema, input);
  if (!parsed.ok) return parsed.result;

  const { createCategory: _ignored, nextDueDate, ...fields } = parsed.data.data;

  try {
    const userId = await getCurrentUserId();
    const result = await prisma.futureFund.updateMany({
      where: { id: parsed.data.id, userId },
      data: { ...fields, nextDueDate: parseDateKey(nextDueDate) },
    });
    if (result.count === 0) return actionError("That fund no longer exists.");

    // Keep the linked budget category in step with the fund it represents.
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

export async function archiveFutureFund(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(archiveFutureFundSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    const archivedAt = parsed.data.archived ? new Date() : null;
    await prisma.futureFund.updateMany({ where: { id: parsed.data.id, userId }, data: { archivedAt } });
    await prisma.category.updateMany({ where: { futureFundId: parsed.data.id, userId }, data: { archivedAt } });
    revalidateFinance();
    return actionOk({ id: parsed.data.id });
  } catch (error) {
    return toActionError(error, "Could not archive the fund.");
  }
}

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

// --- Savings goals ---------------------------------------------------------

export async function createSavingsGoal(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(savingsGoalInputSchema, input);
  if (!parsed.ok) return parsed.result;

  const { targetDate, ...fields } = parsed.data;

  try {
    const userId = await getCurrentUserId();
    const created = await prisma.savingsGoal.create({
      data: {
        ...fields,
        targetDate: parseDateKey(targetDate),
        userId,
        sortOrder: await nextSortOrder("savingsGoal", userId),
      },
    });
    revalidateFinance();
    return actionOk({ id: created.id });
  } catch (error) {
    return toActionError(error, "Could not create the goal.");
  }
}

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

// --- Investments -----------------------------------------------------------

export async function createInvestment(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(investmentInputSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    const created = await prisma.investment.create({
      data: { ...parsed.data, userId, sortOrder: await nextSortOrder("investment", userId) },
    });
    revalidateFinance();
    return actionOk({ id: created.id });
  } catch (error) {
    return toActionError(error, "Could not create the investment.");
  }
}

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

export async function deleteInvestment(input: unknown): Promise<ActionResult<{ archived: boolean }>> {
  const parsed = parseInput(idSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    const investment = await prisma.investment.findFirst({ where: { id: parsed.data.id, userId } });
    if (!investment) return actionError("That investment no longer exists.");

    const used = await prisma.transaction.count({ where: { investmentId: investment.id } });
    if (used > 0) {
      await prisma.investment.update({ where: { id: investment.id }, data: { archivedAt: new Date() } });
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

// --- Net worth -------------------------------------------------------------

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
