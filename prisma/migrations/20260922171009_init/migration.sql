-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE', 'INVESTMENT', 'TRANSFER');

-- CreateEnum
CREATE TYPE "CategoryKind" AS ENUM ('INCOME', 'EXPENSE', 'INVESTMENT', 'SAVINGS', 'FUTURE_FUND');

-- CreateEnum
CREATE TYPE "AccountKind" AS ENUM ('CASH', 'BANK', 'WALLET', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "SavingsGoalKind" AS ENUM ('EMERGENCY', 'GENERAL');

-- CreateEnum
CREATE TYPE "InvestmentKind" AS ENUM ('SIP', 'MUTUAL_FUND', 'STOCKS', 'FIXED_DEPOSIT', 'GOLD', 'RETIREMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "NetWorthEntryKind" AS ENUM ('ASSET', 'LIABILITY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT NOT NULL DEFAULT 'You',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NPR',
    "locale" TEXT NOT NULL DEFAULT 'en-NP',
    "defaultMonthlyIncome" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "demoDataLoaded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "AccountKind" NOT NULL DEFAULT 'OTHER',
    "openingBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "CategoryKind" NOT NULL DEFAULT 'EXPENSE',
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "icon" TEXT NOT NULL DEFAULT 'Circle',
    "carryForward" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "futureFundId" TEXT,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "notes" TEXT,
    "categoryId" TEXT,
    "accountId" TEXT,
    "transferAccountId" TEXT,
    "futureFundId" TEXT,
    "savingsGoalId" TEXT,
    "investmentId" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_budgets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "incomeTarget" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "note" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_items" (
    "id" TEXT NOT NULL,
    "monthlyBudgetId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "plannedAmount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "future_funds" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "monthlyContribution" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "openingBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "nextExpenseLabel" TEXT,
    "nextDueDate" DATE,
    "color" TEXT NOT NULL DEFAULT '#0ea5e9',
    "icon" TEXT NOT NULL DEFAULT 'PiggyBank',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "future_funds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "SavingsGoalKind" NOT NULL DEFAULT 'GENERAL',
    "targetAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "openingBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "monthlyContribution" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "targetDate" DATE,
    "notes" TEXT,
    "color" TEXT NOT NULL DEFAULT '#10b981',
    "icon" TEXT NOT NULL DEFAULT 'Target',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savings_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "InvestmentKind" NOT NULL DEFAULT 'SIP',
    "provider" TEXT,
    "monthlyContribution" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "openingBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "color" TEXT NOT NULL DEFAULT '#8b5cf6',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "net_worth_snapshots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "note" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "net_worth_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "net_worth_entries" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "NetWorthEntryKind" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "net_worth_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- CreateIndex
CREATE INDEX "accounts_userId_archivedAt_idx" ON "accounts"("userId", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_userId_name_key" ON "accounts"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_futureFundId_key" ON "categories"("futureFundId");

-- CreateIndex
CREATE INDEX "categories_userId_kind_archivedAt_idx" ON "categories"("userId", "kind", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "categories_userId_name_key" ON "categories"("userId", "name");

-- CreateIndex
CREATE INDEX "transactions_userId_date_idx" ON "transactions"("userId", "date");

-- CreateIndex
CREATE INDEX "transactions_userId_type_date_idx" ON "transactions"("userId", "type", "date");

-- CreateIndex
CREATE INDEX "transactions_userId_categoryId_date_idx" ON "transactions"("userId", "categoryId", "date");

-- CreateIndex
CREATE INDEX "transactions_userId_futureFundId_idx" ON "transactions"("userId", "futureFundId");

-- CreateIndex
CREATE INDEX "transactions_userId_savingsGoalId_idx" ON "transactions"("userId", "savingsGoalId");

-- CreateIndex
CREATE INDEX "transactions_userId_investmentId_idx" ON "transactions"("userId", "investmentId");

-- CreateIndex
CREATE INDEX "monthly_budgets_userId_month_idx" ON "monthly_budgets"("userId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_budgets_userId_month_key" ON "monthly_budgets"("userId", "month");

-- CreateIndex
CREATE INDEX "budget_items_categoryId_idx" ON "budget_items"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "budget_items_monthlyBudgetId_categoryId_key" ON "budget_items"("monthlyBudgetId", "categoryId");

-- CreateIndex
CREATE INDEX "future_funds_userId_archivedAt_idx" ON "future_funds"("userId", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "future_funds_userId_name_key" ON "future_funds"("userId", "name");

-- CreateIndex
CREATE INDEX "savings_goals_userId_archivedAt_idx" ON "savings_goals"("userId", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "savings_goals_userId_name_key" ON "savings_goals"("userId", "name");

-- CreateIndex
CREATE INDEX "investments_userId_archivedAt_idx" ON "investments"("userId", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "investments_userId_name_key" ON "investments"("userId", "name");

-- CreateIndex
CREATE INDEX "net_worth_snapshots_userId_month_idx" ON "net_worth_snapshots"("userId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "net_worth_snapshots_userId_month_key" ON "net_worth_snapshots"("userId", "month");

-- CreateIndex
CREATE INDEX "net_worth_entries_snapshotId_idx" ON "net_worth_entries"("snapshotId");

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_futureFundId_fkey" FOREIGN KEY ("futureFundId") REFERENCES "future_funds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_transferAccountId_fkey" FOREIGN KEY ("transferAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_futureFundId_fkey" FOREIGN KEY ("futureFundId") REFERENCES "future_funds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_savingsGoalId_fkey" FOREIGN KEY ("savingsGoalId") REFERENCES "savings_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "investments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_budgets" ADD CONSTRAINT "monthly_budgets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_monthlyBudgetId_fkey" FOREIGN KEY ("monthlyBudgetId") REFERENCES "monthly_budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "future_funds" ADD CONSTRAINT "future_funds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "net_worth_snapshots" ADD CONSTRAINT "net_worth_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "net_worth_entries" ADD CONSTRAINT "net_worth_entries_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "net_worth_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
