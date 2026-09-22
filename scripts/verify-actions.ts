/**
 * Exercises the server actions the UI calls, so "the button actually works" is
 * verified rather than assumed: validation, ownership checks, the write itself,
 * and the effect on the numbers the pages read.
 *
 *   npx tsx scripts/verify-actions.ts
 */

import assert from "node:assert/strict";

import { createTransaction, deleteTransaction, updateTransaction } from "@/lib/actions/transactions";
import { copyBudget, saveBudget } from "@/lib/actions/budget";
import { createFutureFund, deleteFutureFund } from "@/lib/actions/funds";
import { prisma } from "@/lib/db/prisma";
import { loadCurrentUser } from "@/lib/db/user";
import { addMonths, currentMonth, toDateKey, toMonthKey } from "@/lib/month";

let passed = 0;
let failed = 0;

async function check(name: string, run: () => Promise<void>) {
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
  const month = currentMonth();
  const date = toDateKey(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 15)));

  const food = await prisma.category.findFirstOrThrow({ where: { userId: user.id, name: "Food" } });
  const fund = await prisma.futureFund.findFirstOrThrow({ where: { userId: user.id, name: "Vehicle" } });
  const goal = await prisma.savingsGoal.findFirstOrThrow({ where: { userId: user.id, kind: "EMERGENCY" } });

  console.log("\nVerifying server actions\n");

  let createdId = "";

  await check("createTransaction inserts a row", async () => {
    const result = await createTransaction({
      type: "EXPENSE",
      amount: 500,
      date,
      description: "[actions] Food",
      categoryId: food.id,
    });

    assert.equal(result.ok, true, result.ok ? "" : result.error);
    if (!result.ok) return;
    createdId = result.data.id;

    const row = await prisma.transaction.findUniqueOrThrow({ where: { id: createdId } });
    assert.equal(Number(row.amount), 500);
    assert.equal(row.categoryId, food.id);
  });

  await check("updateTransaction changes the row", async () => {
    const result = await updateTransaction({
      id: createdId,
      data: {
        type: "EXPENSE",
        amount: 750,
        date,
        description: "[actions] Food (edited)",
        categoryId: food.id,
      },
    });
    assert.equal(result.ok, true, result.ok ? "" : result.error);

    const row = await prisma.transaction.findUniqueOrThrow({ where: { id: createdId } });
    assert.equal(Number(row.amount), 750);
  });

  await check("switching type clears links that no longer apply", async () => {
    // Make it a fund contribution...
    await updateTransaction({
      id: createdId,
      data: {
        type: "TRANSFER",
        amount: 750,
        date,
        description: "[actions] into the fund",
        futureFundId: fund.id,
      },
    });
    let row = await prisma.transaction.findUniqueOrThrow({ where: { id: createdId } });
    assert.equal(row.futureFundId, fund.id);

    // ...then back to an ordinary expense. The fund link must not linger, or it
    // would quietly keep draining the fund.
    await updateTransaction({
      id: createdId,
      data: { type: "EXPENSE", amount: 750, date, description: "[actions] Food", categoryId: food.id },
    });
    row = await prisma.transaction.findUniqueOrThrow({ where: { id: createdId } });
    assert.equal(row.futureFundId, null);
  });

  await check("rejects a zero amount with a field error", async () => {
    const result = await createTransaction({ type: "EXPENSE", amount: 0, date, description: "" });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.fieldErrors?.amount, "expected an error on the amount field");
  });

  await check("rejects an impossible date", async () => {
    const result = await createTransaction({
      type: "EXPENSE",
      amount: 100,
      date: "2026-02-30",
      description: "",
    });
    assert.equal(result.ok, false);
  });

  await check("rejects a transaction linked to both a fund and a goal", async () => {
    const result = await createTransaction({
      type: "TRANSFER",
      amount: 100,
      date,
      description: "",
      futureFundId: fund.id,
      savingsGoalId: goal.id,
    });
    assert.equal(result.ok, false);
  });

  await check("rejects an investment with no investment selected", async () => {
    const result = await createTransaction({ type: "INVESTMENT", amount: 100, date, description: "" });
    assert.equal(result.ok, false);
  });

  await check("rejects an id belonging to nobody", async () => {
    const result = await createTransaction({
      type: "EXPENSE",
      amount: 100,
      date,
      description: "",
      categoryId: "not-a-real-category",
    });
    assert.equal(result.ok, false);
  });

  await check("deleteTransaction removes the row", async () => {
    const result = await deleteTransaction({ id: createdId });
    assert.equal(result.ok, true, result.ok ? "" : result.error);
    const row = await prisma.transaction.findUnique({ where: { id: createdId } });
    assert.equal(row, null);
  });

  // --- Budgets -------------------------------------------------------------
  const futureMonth = addMonths(month, 6);
  const futureKey = toMonthKey(futureMonth);
  const laterKey = toMonthKey(addMonths(month, 7));

  await check("saveBudget writes a plan for one month only", async () => {
    const before = await prisma.monthlyBudget.findUnique({
      where: { userId_month: { userId: user.id, month } },
      include: { items: true },
    });
    const beforeFood = before?.items.find((item) => item.categoryId === food.id);

    const result = await saveBudget({
      month: futureKey,
      incomeTarget: 30_000,
      note: "verification",
      items: [{ categoryId: food.id, plannedAmount: 9_999 }],
    });
    assert.equal(result.ok, true, result.ok ? "" : result.error);

    const after = await prisma.monthlyBudget.findUnique({
      where: { userId_month: { userId: user.id, month } },
      include: { items: true },
    });
    const afterFood = after?.items.find((item) => item.categoryId === food.id);

    assert.equal(
      afterFood ? Number(afterFood.plannedAmount) : null,
      beforeFood ? Number(beforeFood.plannedAmount) : null,
      "editing a future month changed the current month's budget",
    );
  });

  await check("copyBudget duplicates without touching the source", async () => {
    const result = await copyBudget({ from: futureKey, to: laterKey });
    assert.equal(result.ok, true, result.ok ? "" : result.error);

    const source = await prisma.monthlyBudget.findUniqueOrThrow({
      where: { userId_month: { userId: user.id, month: futureMonth } },
      include: { items: true },
    });
    const target = await prisma.monthlyBudget.findUniqueOrThrow({
      where: { userId_month: { userId: user.id, month: addMonths(month, 7) } },
      include: { items: true },
    });

    assert.equal(Number(source.incomeTarget), 30_000);
    assert.equal(Number(target.incomeTarget), 30_000);
    assert.notEqual(source.id, target.id);
    assert.equal(target.items.length, source.items.length);
  });

  await prisma.monthlyBudget.deleteMany({
    where: { userId: user.id, month: { in: [futureMonth, addMonths(month, 7)] } },
  });

  // --- Funds ---------------------------------------------------------------
  await check("createFutureFund also creates its budget category", async () => {
    const result = await createFutureFund({
      name: "[actions] Test fund",
      targetAmount: 1_000,
      monthlyContribution: 100,
      openingBalance: 0,
      color: "#2a78d6",
      icon: "PiggyBank",
      createCategory: true,
    });
    assert.equal(result.ok, true, result.ok ? "" : result.error);
    if (!result.ok) return;

    const category = await prisma.category.findFirst({ where: { futureFundId: result.data.id } });
    assert.ok(category, "no linked category was created");
    assert.equal(category.kind, "FUTURE_FUND");

    const removed = await deleteFutureFund({ id: result.data.id });
    assert.equal(removed.ok, true);
    const gone = await prisma.futureFund.findUnique({ where: { id: result.data.id } });
    assert.equal(gone, null);
  });

  await check("duplicate names are reported, not crashed on", async () => {
    const result = await createFutureFund({
      name: "Vehicle",
      targetAmount: 0,
      monthlyContribution: 0,
      openingBalance: 0,
      color: "#2a78d6",
      icon: "PiggyBank",
      createCategory: false,
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.error, /already exists/i);
  });

  await prisma.transaction.deleteMany({ where: { userId: user.id, description: { startsWith: "[actions]" } } });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("\nVerification crashed:\n", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
