import { z } from "zod";

import {
  cuidSchema,
  hexColorSchema,
  longTextSchema,
  monthKeySchema,
  nonNegativeAmountSchema,
  optionalDateKey,
  optionalText,
  signedAmountSchema,
} from "@/lib/validations/common";

// --- Budgets ---------------------------------------------------------------

export const budgetItemSchema = z.object({
  categoryId: cuidSchema,
  plannedAmount: nonNegativeAmountSchema,
});

export const saveBudgetSchema = z.object({
  month: monthKeySchema,
  incomeTarget: nonNegativeAmountSchema,
  note: longTextSchema,
  items: z.array(budgetItemSchema).max(200, "That is a lot of budget lines"),
});

export type SaveBudgetInput = z.infer<typeof saveBudgetSchema>;

export const copyBudgetSchema = z.object({
  from: monthKeySchema,
  to: monthKeySchema,
});

// --- Categories ------------------------------------------------------------

export const categoryKindSchema = z.enum(["INCOME", "EXPENSE", "INVESTMENT", "SAVINGS", "FUTURE_FUND"]);

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Keep the name short"),
  kind: categoryKindSchema,
  color: hexColorSchema.default("#6366f1"),
  icon: z.string().trim().min(1).max(40).default("Circle"),
  carryForward: z.boolean().default(false),
});

export const updateCategorySchema = z.object({ id: cuidSchema, data: categoryInputSchema });
export const archiveCategorySchema = z.object({ id: cuidSchema, archived: z.boolean() });

// --- Accounts / payment methods -------------------------------------------

export const accountKindSchema = z.enum(["CASH", "BANK", "WALLET", "CARD", "OTHER"]);

export const accountInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Keep the name short"),
  kind: accountKindSchema,
  openingBalance: signedAmountSchema.default(0),
});

export const updateAccountSchema = z.object({ id: cuidSchema, data: accountInputSchema });
export const archiveAccountSchema = z.object({ id: cuidSchema, archived: z.boolean() });

// --- Future funds ----------------------------------------------------------

export const futureFundInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Keep the name short"),
  description: longTextSchema,
  targetAmount: nonNegativeAmountSchema.default(0),
  monthlyContribution: nonNegativeAmountSchema.default(0),
  openingBalance: nonNegativeAmountSchema.default(0),
  nextExpenseLabel: optionalText(80),
  nextDueDate: optionalDateKey,
  color: hexColorSchema.default("#0ea5e9"),
  icon: z.string().trim().min(1).max(40).default("PiggyBank"),
  /** Create a matching budget category so the fund can be budgeted. */
  createCategory: z.boolean().default(true),
});

export const updateFutureFundSchema = z.object({ id: cuidSchema, data: futureFundInputSchema });
export const archiveFutureFundSchema = z.object({ id: cuidSchema, archived: z.boolean() });

// --- Savings goals ---------------------------------------------------------

export const savingsGoalKindSchema = z.enum(["EMERGENCY", "GENERAL"]);

export const savingsGoalInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Keep the name short"),
  kind: savingsGoalKindSchema.default("GENERAL"),
  targetAmount: nonNegativeAmountSchema.default(0),
  openingBalance: nonNegativeAmountSchema.default(0),
  monthlyContribution: nonNegativeAmountSchema.default(0),
  targetDate: optionalDateKey,
  notes: longTextSchema,
  color: hexColorSchema.default("#10b981"),
  icon: z.string().trim().min(1).max(40).default("Target"),
});

export const updateSavingsGoalSchema = z.object({ id: cuidSchema, data: savingsGoalInputSchema });
export const archiveSavingsGoalSchema = z.object({ id: cuidSchema, archived: z.boolean() });

// --- Investments -----------------------------------------------------------

export const investmentKindSchema = z.enum([
  "SIP",
  "MUTUAL_FUND",
  "STOCKS",
  "FIXED_DEPOSIT",
  "GOLD",
  "RETIREMENT",
  "OTHER",
]);

export const investmentInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Keep the name short"),
  kind: investmentKindSchema.default("SIP"),
  provider: optionalText(80),
  monthlyContribution: nonNegativeAmountSchema.default(0),
  openingBalance: nonNegativeAmountSchema.default(0),
  notes: longTextSchema,
  color: hexColorSchema.default("#8b5cf6"),
});

export const updateInvestmentSchema = z.object({ id: cuidSchema, data: investmentInputSchema });
export const archiveInvestmentSchema = z.object({ id: cuidSchema, archived: z.boolean() });

// --- Net worth -------------------------------------------------------------

export const netWorthEntrySchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(60),
  kind: z.enum(["ASSET", "LIABILITY"]),
  amount: signedAmountSchema,
});

export const saveNetWorthSchema = z.object({
  month: monthKeySchema,
  note: longTextSchema,
  entries: z.array(netWorthEntrySchema).min(1, "Add at least one asset or liability").max(60),
});

export const deleteNetWorthSchema = z.object({ month: monthKeySchema });

// --- Settings --------------------------------------------------------------

export const settingsSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  currency: z
    .string()
    .trim()
    .min(1, "Currency is required")
    .max(6, "Use a short code like NPR")
    .transform((value) => value.toUpperCase()),
  locale: z.string().trim().min(2).max(12).default("en-NP"),
  defaultMonthlyIncome: nonNegativeAmountSchema.default(0),
});

export const deleteAllDataSchema = z.object({
  confirmation: z.literal("DELETE", { message: 'Type DELETE to confirm' }),
  /** When true only demo rows are removed. */
  demoOnly: z.boolean().default(false),
});

export const importDataSchema = z.object({
  payload: z.string().min(2, "Paste a backup file"),
  replaceExisting: z.boolean().default(false),
});
