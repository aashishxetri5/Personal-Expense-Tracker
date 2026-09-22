import { SLOT } from "@/lib/chart-colors";
import type { AccountKind, CategoryKind, InvestmentKind, SavingsGoalKind } from "@/lib/types";

/**
 * The starter set every new database gets. These are real, editable rows — not
 * hardcoded behaviour — so the app is useful on first load and still fully
 * customisable from Settings.
 */

export const DEFAULT_ACCOUNTS: {
  name: string;
  kind: AccountKind;
  sortOrder: number;
}[] = [
  { name: "Cash", kind: "CASH", sortOrder: 0 },
  { name: "Bank", kind: "BANK", sortOrder: 1 },
  { name: "eSewa", kind: "WALLET", sortOrder: 2 },
  { name: "Khalti", kind: "WALLET", sortOrder: 3 },
  { name: "Card", kind: "CARD", sortOrder: 4 },
  { name: "Other", kind: "OTHER", sortOrder: 5 },
];

export const DEFAULT_FUTURE_FUNDS: {
  name: string;
  description: string;
  targetAmount: number;
  monthlyContribution: number;
  color: string;
  icon: string;
  sortOrder: number;
  nextExpenseLabel: string;
}[] = [
  {
    name: "Vehicle",
    description: "Servicing, tax, tyres, oil and repairs",
    targetAmount: 10_800,
    monthlyContribution: 900,
    color: SLOT.red,
    icon: "Bike",
    sortOrder: 0,
    nextExpenseLabel: "Servicing",
  },
  {
    name: "Health",
    description: "Doctor visits, dental work and medicine",
    targetAmount: 6_000,
    monthlyContribution: 500,
    color: SLOT.aqua,
    icon: "HeartPulse",
    sortOrder: 1,
    nextExpenseLabel: "Dental check-up",
  },
  {
    name: "Gifts & Occasions",
    description: "Birthdays, festivals and weddings",
    targetAmount: 6_000,
    monthlyContribution: 500,
    color: SLOT.yellow,
    icon: "Gift",
    sortOrder: 2,
    nextExpenseLabel: "Dashain gifts",
  },
  {
    name: "Repairs & Replacement",
    description: "Phone, laptop, shoes, bags and electronics",
    targetAmount: 6_000,
    monthlyContribution: 500,
    color: SLOT.violet,
    icon: "Wrench",
    sortOrder: 3,
    nextExpenseLabel: "Phone battery",
  },
];

/** Categories that are not backed by a future fund. Fund categories are created
 *  alongside their fund so the two stay linked. */
export const DEFAULT_CATEGORIES: {
  name: string;
  kind: CategoryKind;
  color: string;
  icon: string;
  carryForward?: boolean;
  isSystem?: boolean;
  sortOrder: number;
}[] = [
  // Income
  { name: "Salary", kind: "INCOME", color: SLOT.green, icon: "Wallet", isSystem: true, sortOrder: 0 },
  { name: "Freelance", kind: "INCOME", color: SLOT.aqua, icon: "Laptop", sortOrder: 1 },
  { name: "Business", kind: "INCOME", color: SLOT.blue, icon: "Store", sortOrder: 2 },
  { name: "Other Income", kind: "INCOME", color: SLOT.violet, icon: "CirclePlus", sortOrder: 3 },

  // Fixed / regular expenses
  { name: "Food", kind: "EXPENSE", color: SLOT.blue, icon: "UtensilsCrossed", sortOrder: 10 },
  { name: "Fuel", kind: "EXPENSE", color: SLOT.orange, icon: "Fuel", sortOrder: 11 },
  { name: "Gym", kind: "EXPENSE", color: SLOT.aqua, icon: "Dumbbell", sortOrder: 12 },
  { name: "Phone", kind: "EXPENSE", color: SLOT.yellow, icon: "Smartphone", sortOrder: 13 },

  // Lifestyle — the allocation that rolls over
  {
    name: "Lifestyle / Personal",
    kind: "EXPENSE",
    color: SLOT.magenta,
    icon: "Sparkles",
    carryForward: true,
    sortOrder: 20,
  },

  // Investments
  { name: "SIP / Investments", kind: "INVESTMENT", color: SLOT.violet, icon: "TrendingUp", sortOrder: 30 },

  // Savings
  { name: "Savings", kind: "SAVINGS", color: SLOT.green, icon: "PiggyBank", sortOrder: 40 },
];

export const DEFAULT_SAVINGS_GOALS: {
  name: string;
  kind: SavingsGoalKind;
  targetAmount: number;
  monthlyContribution: number;
  color: string;
  icon: string;
  sortOrder: number;
}[] = [
  {
    name: "Emergency Fund",
    kind: "EMERGENCY",
    targetAmount: 75_000,
    monthlyContribution: 3_000,
    color: SLOT.red,
    icon: "ShieldCheck",
    sortOrder: 0,
  },
];

export const DEFAULT_INVESTMENTS: {
  name: string;
  kind: InvestmentKind;
  provider: string;
  monthlyContribution: number;
  color: string;
  sortOrder: number;
}[] = [
  {
    name: "SIP",
    kind: "SIP",
    provider: "Systematic Investment Plan",
    monthlyContribution: 2_504,
    color: SLOT.violet,
    sortOrder: 0,
  },
];

/** Planned monthly amounts used when a brand-new month gets its first budget. */
export const DEFAULT_BUDGET_PLAN: Record<string, number> = {
  "SIP / Investments": 2_504,
  Gym: 1_785,
  Fuel: 4_000,
  Food: 3_000,
  Phone: 200,
  "Lifestyle / Personal": 4_000,
  Vehicle: 900,
  Health: 500,
  "Gifts & Occasions": 500,
  "Repairs & Replacement": 500,
};

export const DEFAULT_MONTHLY_INCOME = 24_000;
