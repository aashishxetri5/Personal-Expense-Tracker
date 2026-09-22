import type {
  AccountKind,
  CategoryKind,
  InvestmentKind,
  TransactionType,
} from "@/lib/types";

/**
 * Human wording for the database enums, kept in one place so a label never
 * drifts between the form that sets it and the list that shows it.
 */

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
  INVESTMENT: "Investment",
  TRANSFER: "Transfer",
};

export const CATEGORY_KIND_LABELS: Record<CategoryKind, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
  INVESTMENT: "Investment",
  SAVINGS: "Savings",
  FUTURE_FUND: "Future fund",
};

export const ACCOUNT_KIND_LABELS: Record<AccountKind, string> = {
  CASH: "Cash",
  BANK: "Bank",
  WALLET: "Wallet",
  CARD: "Card",
  OTHER: "Other",
};

export const INVESTMENT_KIND_LABELS: Record<InvestmentKind, string> = {
  SIP: "SIP",
  MUTUAL_FUND: "Mutual fund",
  STOCKS: "Stocks",
  FIXED_DEPOSIT: "Fixed deposit",
  GOLD: "Gold",
  RETIREMENT: "Retirement",
  OTHER: "Other",
};
