import { z } from "zod";

import {
  amountSchema,
  cuidSchema,
  dateKeySchema,
  longTextSchema,
  optionalId,
  shortTextSchema,
} from "@/lib/validations/common";

const transactionTypeSchema = z.enum(["INCOME", "EXPENSE", "INVESTMENT", "TRANSFER"]);

const baseTransaction = z.object({
  type: transactionTypeSchema,
  amount: amountSchema,
  date: dateKeySchema,
  description: shortTextSchema.default(""),
  notes: longTextSchema,
  categoryId: optionalId,
  accountId: optionalId,
  transferAccountId: optionalId,
  futureFundId: optionalId,
  savingsGoalId: optionalId,
  investmentId: optionalId,
});

/**
 * Cross-field rules that keep the ledger meaningful. Without these a row could
 * claim to be both a fund contribution and a goal contribution, and every
 * downstream total would quietly disagree with itself.
 */
export const transactionInputSchema = baseTransaction.superRefine((value, ctx) => {
  if (value.futureFundId && value.savingsGoalId) {
    ctx.addIssue({
      code: "custom",
      path: ["savingsGoalId"],
      message: "Link a transaction to a future fund or a savings goal, not both",
    });
  }

  if (value.type === "INVESTMENT" && !value.investmentId) {
    ctx.addIssue({
      code: "custom",
      path: ["investmentId"],
      message: "Choose which investment this went into",
    });
  }

  if (value.type !== "INVESTMENT" && value.investmentId) {
    ctx.addIssue({
      code: "custom",
      path: ["investmentId"],
      message: "Only investment transactions can be linked to an investment",
    });
  }

  if (value.type === "TRANSFER" && !value.futureFundId && !value.savingsGoalId && !value.transferAccountId) {
    ctx.addIssue({
      code: "custom",
      path: ["transferAccountId"],
      message: "Choose a destination: a future fund, a savings goal, or another account",
    });
  }

  if (
    value.type === "TRANSFER" &&
    value.transferAccountId &&
    value.transferAccountId === value.accountId
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["transferAccountId"],
      message: "Pick a different destination account",
    });
  }

  if (value.type === "INCOME" && (value.futureFundId || value.savingsGoalId)) {
    ctx.addIssue({
      code: "custom",
      path: ["futureFundId"],
      message: "Record income first, then transfer it into a fund or goal",
    });
  }
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;

export const updateTransactionSchema = z.object({
  id: cuidSchema,
  data: transactionInputSchema,
});

export const deleteTransactionSchema = z.object({ id: cuidSchema });

/** Filters accepted by the transactions list (all optional). */
export const transactionFilterSchema = z.object({
  search: z.string().trim().max(120).optional(),
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional(),
  from: dateKeySchema.optional(),
  to: dateKeySchema.optional(),
  categoryId: z.string().optional(),
  type: transactionTypeSchema.optional(),
  accountId: z.string().optional(),
  futureFundId: z.string().optional(),
  sort: z.enum(["date-desc", "date-asc", "amount-desc", "amount-asc"]).default("date-desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(10).max(200).default(25),
});

export type TransactionFilter = z.infer<typeof transactionFilterSchema>;
