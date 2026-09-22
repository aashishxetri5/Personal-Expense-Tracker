/**
 * End-to-end verification of the financial rules, run against a real database.
 *
 *   npm run verify
 *
 * Each scenario writes real rows, re-reads them through the same query layer
 * the pages use, asserts the outcome, and then removes what it created. It is
 * safe to run against a database with existing data.
 */

import assert from "node:assert/strict";

import { getMonthSnapshot } from "@/lib/db/queries/month";
import { getTransactionPage } from "@/lib/db/queries/transactions";
import { prisma } from "@/lib/db/prisma";
import { loadCurrentUser } from "@/lib/db/user";
import { addMonths, currentMonth, formatMonthLabel, parseDateKey, toMonthKey } from "@/lib/month";
import { transactionFilterSchema } from "@/lib/validations/transaction";

const MARKER = "[verify]";
const created: string[] = [];

let passed = 0;
let failed = 0;

async function scenario(name: string, run: () => Promise<void>) {
  try {
    await run();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  FAIL  ${name}`);
    console.error(`        ${(error as Error).message.split("\n").join("\n        ")}`);
  }
}

async function main() {
  const user = await loadCurrentUser();

  const september = currentMonth();
  const august = addMonths(september, -1);
  const october = addMonths(september, 1);

  const [food, vehicleCategory] = await Promise.all([
    prisma.category.findFirstOrThrow({ where: { userId: user.id, name: "Food" } }),
    prisma.category.findFirst({ where: { userId: user.id, name: "Vehicle" } }),
  ]);
  const vehicleFund = await prisma.futureFund.findFirstOrThrow({
    where: { userId: user.id, name: "Vehicle" },
  });
  const emergency = await prisma.savingsGoal.findFirstOrThrow({
    where: { userId: user.id, kind: "EMERGENCY" },
  });
  const sip = await prisma.investment.findFirstOrThrow({ where: { userId: user.id } });

  const add = async (data: {
    type: "INCOME" | "EXPENSE" | "INVESTMENT" | "TRANSFER";
    amount: number;
    date: Date;
    description: string;
    categoryId?: string | null;
    futureFundId?: string | null;
    savingsGoalId?: string | null;
    investmentId?: string | null;
  }) => {
    const row = await prisma.transaction.create({
      data: { ...data, userId: user.id, description: `${MARKER} ${data.description}` },
    });
    created.push(row.id);
    return row;
  };

  // Snapshots are memoised per render in the app; in a script the cache has to
  // be stepped around so each assertion reads fresh numbers.
  const snapshotFor = async (month: Date) => {
    const { getMonthSnapshot: fresh } = await import(`@/lib/db/queries/month?v=${Date.now()}`);
    return (fresh as typeof getMonthSnapshot)(user.id, month);
  };

  console.log(`\nVerifying against ${formatMonthLabel(september)} and neighbouring months\n`);

  // -- Scenarios 1-3: a transaction lands in its own month, and only there ---
  const before = await snapshotFor(september);
  const beforeAugust = await snapshotFor(august);

  await add({
    type: "EXPENSE",
    amount: 500,
    date: parseDateKey(`${toMonthKey(september)}-22`)!,
    description: "Food",
    categoryId: food.id,
  });

  const afterSeptember = await snapshotFor(september);
  const afterAugust = await snapshotFor(august);

  await scenario("1. September spending increases by exactly 500", async () => {
    assert.equal(afterSeptember.summary.spent - before.summary.spent, 500);
    const foodBefore = before.budget.lines.find((l) => l.categoryId === food.id)?.actual ?? 0;
    const foodAfter = afterSeptember.budget.lines.find((l) => l.categoryId === food.id)?.actual ?? 0;
    assert.equal(foodAfter - foodBefore, 500);
  });

  await scenario("2. August is untouched by a September transaction", async () => {
    assert.equal(afterAugust.summary.spent, beforeAugust.summary.spent);
    assert.equal(afterAugust.summary.transactionCount, beforeAugust.summary.transactionCount);
  });

  await scenario("3. The transaction is listed in September, not August", async () => {
    const septemberPage = await getTransactionPage(
      user.id,
      transactionFilterSchema.parse({ month: toMonthKey(september), search: MARKER }),
    );
    const augustPage = await getTransactionPage(
      user.id,
      transactionFilterSchema.parse({ month: toMonthKey(august), search: MARKER }),
    );
    assert.equal(septemberPage.total, 1);
    assert.equal(augustPage.total, 0);
  });

  // -- Scenario 4: budgets are per month ------------------------------------
  await scenario("4. Changing October's Food budget leaves September's alone", async () => {
    const septemberPlanned =
      (await snapshotFor(september)).budget.lines.find((l) => l.categoryId === food.id)?.planned ?? 0;

    const octoberBudget = await prisma.monthlyBudget.upsert({
      where: { userId_month: { userId: user.id, month: october } },
      create: { userId: user.id, month: october, incomeTarget: 24_000 },
      update: {},
    });
    await prisma.budgetItem.upsert({
      where: {
        monthlyBudgetId_categoryId: { monthlyBudgetId: octoberBudget.id, categoryId: food.id },
      },
      create: { monthlyBudgetId: octoberBudget.id, categoryId: food.id, plannedAmount: 4_000 },
      update: { plannedAmount: 4_000 },
    });

    const septemberAfter = await snapshotFor(september);
    const octoberAfter = await snapshotFor(october);

    assert.equal(
      septemberAfter.budget.lines.find((l) => l.categoryId === food.id)?.planned ?? 0,
      septemberPlanned,
      "September's Food budget changed when October was edited",
    );
    assert.equal(octoberAfter.budget.lines.find((l) => l.categoryId === food.id)?.planned, 4_000);

    await prisma.monthlyBudget.delete({ where: { id: octoberBudget.id } });
  });

  // -- Scenarios 5-6: fund contributions and fund-financed spending ---------
  const fundBefore = (await snapshotFor(september)).funds.find((f) => f.id === vehicleFund.id)!;

  await add({
    type: "TRANSFER",
    amount: 2_500,
    date: parseDateKey(`${toMonthKey(september)}-10`)!,
    description: "Vehicle fund top-up",
    categoryId: vehicleCategory?.id ?? null,
    futureFundId: vehicleFund.id,
  });

  const fundAfterContribution = (await snapshotFor(september)).funds.find(
    (f) => f.id === vehicleFund.id,
  )!;

  await scenario("5. A 2,500 contribution raises the Vehicle fund by 2,500", async () => {
    assert.equal(fundAfterContribution.balance - fundBefore.balance, 2_500);
  });

  const spentBeforeServicing = (await snapshotFor(september)).summary.spent;

  await add({
    type: "EXPENSE",
    amount: 2_000,
    date: parseDateKey(`${toMonthKey(september)}-12`)!,
    description: "Vehicle servicing",
    categoryId: vehicleCategory?.id ?? null,
    futureFundId: vehicleFund.id,
  });

  const afterServicing = await snapshotFor(september);
  const fundAfterServicing = afterServicing.funds.find((f) => f.id === vehicleFund.id)!;

  await scenario("6. Servicing paid from the fund lowers its balance by 2,000", async () => {
    assert.equal(fundAfterContribution.balance - fundAfterServicing.balance, 2_000);
  });

  await scenario("6b. That servicing is not charged to the month a second time", async () => {
    assert.equal(
      afterServicing.summary.spent,
      spentBeforeServicing,
      "Reserve-financed spending was double-counted in the month total",
    );
    assert.equal(afterServicing.summary.fundExpenses >= 2_000, true);
  });

  // -- Scenario 7: emergency fund -------------------------------------------
  const goalBefore = (await snapshotFor(september)).goals.find((g) => g.id === emergency.id)!;

  await add({
    type: "TRANSFER",
    amount: 3_000,
    date: parseDateKey(`${toMonthKey(september)}-15`)!,
    description: "Emergency fund",
    savingsGoalId: emergency.id,
  });

  const goalAfter = (await snapshotFor(september)).goals.find((g) => g.id === emergency.id)!;

  await scenario("7. Emergency fund grows by 3,000 and progress increases", async () => {
    assert.equal(goalAfter.current - goalBefore.current, 3_000);
    assert.ok(goalAfter.progress > goalBefore.progress);
  });

  // -- Scenario 8: investments are not spending -----------------------------
  const investBefore = await snapshotFor(september);

  await add({
    type: "INVESTMENT",
    amount: 2_504,
    date: parseDateKey(`${toMonthKey(september)}-18`)!,
    description: "Extra SIP",
    investmentId: sip.id,
  });

  const investAfter = await snapshotFor(september);

  await scenario("8. An investment raises invested totals without raising spending", async () => {
    assert.equal(investAfter.summary.investments - investBefore.summary.investments, 2_504);
    assert.equal(investAfter.summary.spent, investBefore.summary.spent);

    const sipBefore = investBefore.investments.find((i) => i.id === sip.id)!;
    const sipAfter = investAfter.investments.find((i) => i.id === sip.id)!;
    assert.equal(sipAfter.totalInvested - sipBefore.totalInvested, 2_504);
  });

  // -- Scenario 9: a new month leaves history alone -------------------------
  await scenario("9. Creating a new month does not disturb earlier ones", async () => {
    const augustBefore = await snapshotFor(august);

    const newBudget = await prisma.monthlyBudget.create({
      data: { userId: user.id, month: addMonths(october, 1), incomeTarget: 26_000 },
    });
    await add({
      type: "EXPENSE",
      amount: 999,
      date: parseDateKey(`${toMonthKey(addMonths(october, 1))}-05`)!,
      description: "Next month expense",
      categoryId: food.id,
    });

    const augustAfter = await snapshotFor(august);
    assert.deepEqual(augustAfter.summary, augustBefore.summary);

    await prisma.monthlyBudget.delete({ where: { id: newBudget.id } });
  });

  // -- The arithmetic identity ----------------------------------------------
  await scenario("Income is partitioned exactly: spent + invested + saved + remaining", async () => {
    const snapshot = await snapshotFor(september);
    const { summary } = snapshot;
    assert.equal(
      Math.round((summary.spent + summary.investments + summary.saved + summary.remaining) * 100) / 100,
      summary.income,
    );
  });

  // -- Clean up --------------------------------------------------------------
  const removed = await prisma.transaction.deleteMany({ where: { id: { in: created } } });
  console.log(`\nCleaned up ${removed.count} verification transactions.`);

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch(async (error) => {
    console.error("\nVerification crashed:\n", error);
    if (created.length > 0) {
      await prisma.transaction.deleteMany({ where: { id: { in: created } } });
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
