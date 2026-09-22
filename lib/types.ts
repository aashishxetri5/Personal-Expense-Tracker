/**
 * Plain, serialisable shapes shared between server queries and client
 * components. Prisma `Decimal` and `Date` objects are converted at the query
 * boundary so nothing below this line has to know about the ORM.
 */

export type TransactionType = "INCOME" | "EXPENSE" | "INVESTMENT" | "TRANSFER";

export type CategoryKind = "INCOME" | "EXPENSE" | "INVESTMENT" | "SAVINGS" | "FUTURE_FUND";

export type AccountKind = "CASH" | "BANK" | "WALLET" | "CARD" | "OTHER";

export type SavingsGoalKind = "EMERGENCY" | "GENERAL";

export type InvestmentKind =
  | "SIP"
  | "MUTUAL_FUND"
  | "STOCKS"
  | "FIXED_DEPOSIT"
  | "GOLD"
  | "RETIREMENT"
  | "OTHER";

export type NetWorthEntryKind = "ASSET" | "LIABILITY";

/**
 * The minimum a transaction needs to expose for the calculation layer. Queries
 * that only need totals select exactly these columns.
 */
export type LedgerEntry = {
  type: TransactionType;
  amount: number;
  /** UTC-midnight date-only value. */
  date: Date;
  categoryId: string | null;
  futureFundId: string | null;
  savingsGoalId: string | null;
  investmentId: string | null;
};

export type TransactionDTO = {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  notes: string | null;
  isDemo: boolean;
  category: { id: string; name: string; kind: CategoryKind; color: string; icon: string } | null;
  account: { id: string; name: string; kind: AccountKind } | null;
  transferAccount: { id: string; name: string } | null;
  futureFund: { id: string; name: string; color: string } | null;
  savingsGoal: { id: string; name: string; color: string } | null;
  investment: { id: string; name: string } | null;
};

export type CategoryDTO = {
  id: string;
  name: string;
  kind: CategoryKind;
  color: string;
  icon: string;
  carryForward: boolean;
  isSystem: boolean;
  sortOrder: number;
  archived: boolean;
  futureFundId: string | null;
};

export type AccountDTO = {
  id: string;
  name: string;
  kind: AccountKind;
  openingBalance: number;
  sortOrder: number;
  archived: boolean;
};

export type FutureFundDTO = {
  id: string;
  name: string;
  description: string | null;
  targetAmount: number;
  monthlyContribution: number;
  openingBalance: number;
  nextExpenseLabel: string | null;
  nextDueDate: string | null;
  color: string;
  icon: string;
  archived: boolean;
  categoryId: string | null;
};

export type FutureFundWithBalance = FutureFundDTO & {
  /** Opening balance + all contributions - all fund-financed spending. */
  balance: number;
  contributedThisMonth: number;
  spentThisMonth: number;
  progress: number;
};

export type SavingsGoalDTO = {
  id: string;
  name: string;
  kind: SavingsGoalKind;
  targetAmount: number;
  openingBalance: number;
  monthlyContribution: number;
  targetDate: string | null;
  notes: string | null;
  color: string;
  icon: string;
  archived: boolean;
};

export type SavingsGoalWithProgress = SavingsGoalDTO & {
  current: number;
  contributedThisMonth: number;
  progress: number;
  /** Months of contributions still needed, null when unknowable. */
  monthsRemaining: number | null;
};

export type InvestmentDTO = {
  id: string;
  name: string;
  kind: InvestmentKind;
  provider: string | null;
  monthlyContribution: number;
  openingBalance: number;
  notes: string | null;
  color: string;
  archived: boolean;
};

export type InvestmentWithTotals = InvestmentDTO & {
  totalInvested: number;
  investedThisMonth: number;
  investedThisYear: number;
};

export type NetWorthEntryDTO = {
  id: string;
  label: string;
  kind: NetWorthEntryKind;
  amount: number;
  sortOrder: number;
};

export type NetWorthSnapshotDTO = {
  id: string;
  month: string;
  note: string | null;
  entries: NetWorthEntryDTO[];
  assets: number;
  liabilities: number;
  netWorth: number;
};
