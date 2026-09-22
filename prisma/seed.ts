/**
 * Demo data — run with `npm run db:seed`.
 * Every row is flagged isDemo so Settings can remove it in one go, and
 * re-running replaces the previous demo data rather than duplicating it.
 */

import { prisma } from "@/lib/db/prisma";
import { DEFAULT_BUDGET_PLAN, DEFAULT_MONTHLY_INCOME } from "@/lib/db/defaults";
import { loadCurrentUser } from "@/lib/db/user";
import { addMonths, currentMonth, daysInMonth, formatMonthLabel, toMonthKey } from "@/lib/month";

/** How many months of history to create, ending with the current month. */
const MONTHS_OF_HISTORY = 8;

/** Deterministic PRNG so the demo data is the same on every machine. */
function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = makeRandom(20260922);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

function between(min: number, max: number, step = 10): number {
  const value = min + random() * (max - min);
  return Math.round(value / step) * step;
}

function dayIn(month: Date, day: number): Date {
  const clamped = Math.min(Math.max(day, 1), daysInMonth(month));
  return new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), clamped));
}

const FOOD_NOTES = [
  "Groceries",
  "Vegetables",
  "Lunch out",
  "Milk and eggs",
  "Rice and lentils",
  "Tea and snacks",
  "Fruit",
  "Dinner with friends",
];

const FUEL_NOTES = ["Petrol", "Petrol top-up", "Fuel"];

const LIFESTYLE_NOTES = [
  "Cinema",
  "New shirt",
  "Books",
  "Coffee with friends",
  "Headphones",
  "Weekend trip",
];

type TxnSeed = {
  type: "INCOME" | "EXPENSE" | "INVESTMENT" | "TRANSFER";
  amount: number;
  date: Date;
  description: string;
  categoryId?: string | null;
  accountId?: string | null;
  futureFundId?: string | null;
  savingsGoalId?: string | null;
  investmentId?: string | null;
  notes?: string | null;
};

async function main() {
  console.log("Seeding demo data…\n");

  // Ensures the workspace, categories, accounts, funds, goals and investments
  // exist before any demo rows reference them.
  const user = await loadCurrentUser();

  const [categories, accounts, funds, goals, investments] = await Promise.all([
    prisma.category.findMany({ where: { userId: user.id } }),
    prisma.account.findMany({ where: { userId: user.id } }),
    prisma.futureFund.findMany({ where: { userId: user.id } }),
    prisma.savingsGoal.findMany({ where: { userId: user.id } }),
    prisma.investment.findMany({ where: { userId: user.id } }),
  ]);

  const categoryByName = new Map(categories.map((row) => [row.name, row]));
  const accountByName = new Map(accounts.map((row) => [row.name, row]));
  const fundByName = new Map(funds.map((row) => [row.name, row]));

  const need = <T>(value: T | undefined, label: string): T => {
    if (!value) throw new Error(`Missing ${label}. Run "npx prisma migrate deploy" first.`);
    return value;
  };

  const salary = need(categoryByName.get("Salary"), "Salary category");
  const freelance = need(categoryByName.get("Freelance"), "Freelance category");
  const food = need(categoryByName.get("Food"), "Food category");
  const fuel = need(categoryByName.get("Fuel"), "Fuel category");
  const gym = need(categoryByName.get("Gym"), "Gym category");
  const phone = need(categoryByName.get("Phone"), "Phone category");
  const lifestyle = need(categoryByName.get("Lifestyle / Personal"), "Lifestyle category");
  const sipCategory = need(categoryByName.get("SIP / Investments"), "SIP category");
  const savingsCategory = need(categoryByName.get("Savings"), "Savings category");

  const bank = need(accountByName.get("Bank"), "Bank account");
  const cash = need(accountByName.get("Cash"), "Cash account");
  const esewa = need(accountByName.get("eSewa"), "eSewa account");

  const vehicleFund = need(fundByName.get("Vehicle"), "Vehicle fund");
  const healthFund = need(fundByName.get("Health"), "Health fund");
  const giftsFund = need(fundByName.get("Gifts & Occasions"), "Gifts fund");
  const repairsFund = need(fundByName.get("Repairs & Replacement"), "Repairs fund");

  const emergencyGoal = need(
    goals.find((goal) => goal.kind === "EMERGENCY"),
    "Emergency fund goal",
  );
  const sip = need(investments[0], "SIP investment");

  // --- Start clean ---------------------------------------------------------
  const removed = await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { userId: user.id, isDemo: true } }),
    prisma.monthlyBudget.deleteMany({ where: { userId: user.id, isDemo: true } }),
    prisma.netWorthSnapshot.deleteMany({ where: { userId: user.id, isDemo: true } }),
  ]);
  const removedCount = removed.reduce((sum, result) => sum + result.count, 0);
  if (removedCount > 0) console.log(`Removed ${removedCount} existing demo records.\n`);

  const thisMonth = currentMonth();
  const months = Array.from({ length: MONTHS_OF_HISTORY }, (_, index) =>
    addMonths(thisMonth, -(MONTHS_OF_HISTORY - 1 - index)),
  );

  /** One-off bills paid out of a fund, to show reserves being drawn down. */
  const fundExpenses: Record<string, { fundId: string; amount: number; description: string; day: number }[]> = {
    [toMonthKey(months[2])]: [
      { fundId: vehicleFund.id, amount: 2_500, description: "Scooter servicing", day: 14 },
    ],
    [toMonthKey(months[4])]: [
      { fundId: healthFund.id, amount: 1_800, description: "Dental check-up", day: 9 },
    ],
    [toMonthKey(months[6])]: [
      { fundId: giftsFund.id, amount: 2_200, description: "Wedding gift", day: 18 },
      { fundId: repairsFund.id, amount: 1_400, description: "Phone battery replacement", day: 24 },
    ],
  };

  /** Lifestyle spending varies deliberately so the roll-over is visible. */
  const lifestylePlan: Record<number, number[]> = {
    0: [1_200],
    1: [],
    2: [900, 650],
    3: [1_500],
    4: [],
    5: [3_500],
    6: [1_100],
    7: [750],
  };

  let totalTransactions = 0;

  for (const [index, month] of months.entries()) {
    const monthKey = toMonthKey(month);
    const isCurrentMonth = index === months.length - 1;
    // The current month is only partly through, so stop at today.
    const lastDay = isCurrentMonth ? new Date().getUTCDate() : daysInMonth(month);

    const transactions: TxnSeed[] = [];
    const push = (txn: TxnSeed) => {
      if (txn.date.getUTCDate() <= lastDay) transactions.push(txn);
    };

    // Income --------------------------------------------------------------
    push({
      type: "INCOME",
      amount: DEFAULT_MONTHLY_INCOME,
      date: dayIn(month, 1),
      description: "Monthly salary",
      categoryId: salary.id,
      accountId: bank.id,
    });

    if (index % 3 === 1) {
      push({
        type: "INCOME",
        amount: between(2_500, 4_500, 250),
        date: dayIn(month, 17),
        description: "Freelance project",
        categoryId: freelance.id,
        accountId: esewa.id,
      });
    }

    // Fixed costs ----------------------------------------------------------
    push({
      type: "EXPENSE",
      amount: 1_785,
      date: dayIn(month, 3),
      description: "Gym membership",
      categoryId: gym.id,
      accountId: esewa.id,
    });
    push({
      type: "EXPENSE",
      amount: 200,
      date: dayIn(month, 10),
      description: "Phone recharge",
      categoryId: phone.id,
      accountId: esewa.id,
    });

    // Investment -----------------------------------------------------------
    push({
      type: "INVESTMENT",
      amount: 2_504,
      date: dayIn(month, 5),
      description: "Monthly SIP",
      categoryId: sipCategory.id,
      accountId: bank.id,
      investmentId: sip.id,
    });

    // Money set aside into sinking funds ------------------------------------
    for (const [fund, categoryName] of [
      [vehicleFund, "Vehicle"],
      [healthFund, "Health"],
      [giftsFund, "Gifts & Occasions"],
      [repairsFund, "Repairs & Replacement"],
    ] as const) {
      const category = categoryByName.get(categoryName);
      push({
        type: "TRANSFER",
        amount: Number(fund.monthlyContribution),
        date: dayIn(month, 2),
        description: `${fund.name} fund contribution`,
        categoryId: category?.id ?? null,
        accountId: bank.id,
        futureFundId: fund.id,
      });
    }

    // Emergency fund --------------------------------------------------------
    push({
      type: "TRANSFER",
      amount: 3_000,
      date: dayIn(month, 2),
      description: "Emergency fund",
      categoryId: savingsCategory.id,
      accountId: bank.id,
      savingsGoalId: emergencyGoal.id,
    });

    // Everyday spending -----------------------------------------------------
    const fuelFills = 3 + Math.round(random());
    for (let i = 0; i < fuelFills; i += 1) {
      push({
        type: "EXPENSE",
        amount: between(650, 1_250, 10),
        date: dayIn(month, 4 + i * 7 + Math.round(random() * 2)),
        description: pick(FUEL_NOTES),
        categoryId: fuel.id,
        accountId: pick([cash, esewa]).id,
      });
    }

    const foodEntries = 7 + Math.round(random() * 4);
    for (let i = 0; i < foodEntries; i += 1) {
      push({
        type: "EXPENSE",
        amount: between(180, 620, 5),
        date: dayIn(month, 2 + Math.round((i * 28) / foodEntries) + Math.round(random() * 2)),
        description: pick(FOOD_NOTES),
        categoryId: food.id,
        accountId: pick([cash, esewa, bank]).id,
      });
    }

    for (const [i, amount] of (lifestylePlan[index] ?? []).entries()) {
      push({
        type: "EXPENSE",
        amount,
        date: dayIn(month, 12 + i * 6),
        description: pick(LIFESTYLE_NOTES),
        categoryId: lifestyle.id,
        accountId: pick([cash, esewa]).id,
        notes: amount >= 3_000 ? "Saved up for this across a few months" : null,
      });
    }

    // Bills paid out of a reserve -------------------------------------------
    for (const expense of fundExpenses[monthKey] ?? []) {
      const fund = funds.find((row) => row.id === expense.fundId);
      const category = fund ? categoryByName.get(fund.name) : undefined;
      push({
        type: "EXPENSE",
        amount: expense.amount,
        date: dayIn(month, expense.day),
        description: expense.description,
        categoryId: category?.id ?? null,
        accountId: bank.id,
        futureFundId: expense.fundId,
        notes: "Paid from the reserve, not from this month's budget",
      });
    }

    await prisma.transaction.createMany({
      data: transactions.map((txn) => ({
        userId: user.id,
        type: txn.type,
        amount: txn.amount,
        date: txn.date,
        description: txn.description,
        notes: txn.notes ?? null,
        categoryId: txn.categoryId ?? null,
        accountId: txn.accountId ?? null,
        futureFundId: txn.futureFundId ?? null,
        savingsGoalId: txn.savingsGoalId ?? null,
        investmentId: txn.investmentId ?? null,
        isDemo: true,
      })),
    });
    totalTransactions += transactions.length;

    // Budget — its own record per month, never shared -------------------------
    const budgetItems = Object.entries(DEFAULT_BUDGET_PLAN)
      .map(([name, planned]) => {
        const category = categoryByName.get(name);
        return category ? { categoryId: category.id, plannedAmount: planned } : null;
      })
      .filter((item): item is { categoryId: string; plannedAmount: number } => item !== null);

    await prisma.monthlyBudget.create({
      data: {
        userId: user.id,
        month,
        incomeTarget: DEFAULT_MONTHLY_INCOME,
        isDemo: true,
        items: { create: budgetItems },
      },
    });

    // Net worth snapshot ------------------------------------------------------
    const elapsed = index + 1;
    await prisma.netWorthSnapshot.create({
      data: {
        userId: user.id,
        month,
        isDemo: true,
        note: index === 0 ? "First snapshot" : null,
        entries: {
          create: [
            { label: "Cash", kind: "ASSET", amount: between(2_000, 5_000, 100), sortOrder: 0 },
            {
              label: "Bank",
              kind: "ASSET",
              amount: 18_000 + elapsed * between(2_800, 4_200, 100),
              sortOrder: 1,
            },
            { label: "Emergency fund", kind: "ASSET", amount: elapsed * 3_000, sortOrder: 2 },
            { label: "Investments", kind: "ASSET", amount: elapsed * 2_504, sortOrder: 3 },
            {
              label: "Future funds",
              kind: "ASSET",
              amount: Math.max(0, elapsed * 2_400 - (index >= 2 ? 2_500 : 0) - (index >= 4 ? 1_800 : 0)),
              sortOrder: 4,
            },
            {
              label: "Phone loan",
              kind: "LIABILITY",
              amount: Math.max(0, 24_000 - elapsed * 3_000),
              sortOrder: 5,
            },
          ],
        },
      },
    });

    console.log(
      `  ${formatMonthLabel(month).padEnd(16)} ${String(transactions.length).padStart(3)} transactions, budget + snapshot`,
    );
  }

  await prisma.userSettings.update({
    where: { userId: user.id },
    data: { demoDataLoaded: true, defaultMonthlyIncome: DEFAULT_MONTHLY_INCOME },
  });

  console.log(
    `\nDone — ${totalTransactions} transactions across ${months.length} months (${formatMonthLabel(
      months[0],
    )} to ${formatMonthLabel(months[months.length - 1])}).`,
  );
  console.log("Everything is flagged as demo data and can be removed from Settings.");
}

main()
  .catch((error) => {
    console.error("\nSeeding failed:\n", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
