"use server";

import { parseInput, revalidateFinance, toActionError } from "@/lib/actions/helpers";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/db/user";
import { parseDateKey } from "@/lib/month";
import { actionError, actionOk, type ActionResult } from "@/lib/validations/common";
import {
  deleteTransactionSchema,
  transactionInputSchema,
  updateTransactionSchema,
  type TransactionInput,
} from "@/lib/validations/transaction";

/**
 * Turn validated form input into a database row.
 *
 * Links that do not apply to the chosen type are cleared rather than carried
 * over. Without this, switching a transaction from "Transfer to Vehicle fund"
 * to "Expense" would leave the fund link behind and quietly drain the fund.
 */
function toRowData(input: TransactionInput) {
  const date = parseDateKey(input.date);
  if (!date) throw new Error("Invalid date");

  const isTransfer = input.type === "TRANSFER";
  const isExpense = input.type === "EXPENSE";
  const allowsReserveLink = isTransfer || isExpense;

  return {
    type: input.type,
    amount: input.amount,
    date,
    description: input.description?.trim() ?? "",
    notes: input.notes,
    categoryId: input.categoryId,
    accountId: input.accountId,
    transferAccountId: isTransfer ? input.transferAccountId : null,
    futureFundId: allowsReserveLink ? input.futureFundId : null,
    savingsGoalId: allowsReserveLink ? input.savingsGoalId : null,
    investmentId: input.type === "INVESTMENT" ? input.investmentId : null,
  };
}

/** Confirm every referenced row belongs to this user before writing. */
async function assertOwnership(userId: string, data: ReturnType<typeof toRowData>) {
  const checks: Promise<number>[] = [];

  if (data.categoryId) checks.push(prisma.category.count({ where: { id: data.categoryId, userId } }));
  if (data.accountId) checks.push(prisma.account.count({ where: { id: data.accountId, userId } }));
  if (data.transferAccountId)
    checks.push(prisma.account.count({ where: { id: data.transferAccountId, userId } }));
  if (data.futureFundId)
    checks.push(prisma.futureFund.count({ where: { id: data.futureFundId, userId } }));
  if (data.savingsGoalId)
    checks.push(prisma.savingsGoal.count({ where: { id: data.savingsGoalId, userId } }));
  if (data.investmentId)
    checks.push(prisma.investment.count({ where: { id: data.investmentId, userId } }));

  const results = await Promise.all(checks);
  if (results.some((count) => count === 0)) {
    throw new Error("One of the selected options no longer exists.");
  }
}

export async function createTransaction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(transactionInputSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    const data = toRowData(parsed.data);
    await assertOwnership(userId, data);

    const created = await prisma.transaction.create({ data: { ...data, userId } });
    revalidateFinance();
    return actionOk({ id: created.id });
  } catch (error) {
    return toActionError(error, "Could not save the transaction.");
  }
}

export async function updateTransaction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(updateTransactionSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    const data = toRowData(parsed.data.data);
    await assertOwnership(userId, data);

    const result = await prisma.transaction.updateMany({
      where: { id: parsed.data.id, userId },
      data,
    });
    if (result.count === 0) return actionError("That transaction no longer exists.");

    revalidateFinance();
    return actionOk({ id: parsed.data.id });
  } catch (error) {
    return toActionError(error, "Could not update the transaction.");
  }
}

export async function deleteTransaction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(deleteTransactionSchema, input);
  if (!parsed.ok) return parsed.result;

  try {
    const userId = await getCurrentUserId();
    const result = await prisma.transaction.deleteMany({ where: { id: parsed.data.id, userId } });
    if (result.count === 0) return actionError("That transaction no longer exists.");

    revalidateFinance();
    return actionOk({ id: parsed.data.id });
  } catch (error) {
    return toActionError(error, "Could not delete the transaction.");
  }
}
