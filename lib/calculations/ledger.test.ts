import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { categoryActuals, classify, countsAgainstBudget, summarise } from "@/lib/calculations/ledger";
import type { LedgerEntry } from "@/lib/types";

const DATE = new Date(Date.UTC(2026, 8, 22));

function entry(partial: Partial<LedgerEntry> & Pick<LedgerEntry, "type" | "amount">): LedgerEntry {
  return {
    date: DATE,
    categoryId: null,
    futureFundId: null,
    savingsGoalId: null,
    investmentId: null,
    ...partial,
  };
}

describe("classify", () => {
  it("separates the four ways money can move", () => {
    assert.equal(classify(entry({ type: "INCOME", amount: 1 })), "income");
    assert.equal(classify(entry({ type: "EXPENSE", amount: 1 })), "expense");
    assert.equal(classify(entry({ type: "INVESTMENT", amount: 1 })), "investment");
    assert.equal(classify(entry({ type: "TRANSFER", amount: 1 })), "accountTransfer");
  });

  it("treats a fund-linked expense as spending from the reserve", () => {
    assert.equal(classify(entry({ type: "EXPENSE", amount: 1, futureFundId: "f1" })), "fundExpense");
    assert.equal(classify(entry({ type: "TRANSFER", amount: 1, futureFundId: "f1" })), "fundContribution");
  });

  it("treats a goal-linked expense as a withdrawal", () => {
    assert.equal(classify(entry({ type: "EXPENSE", amount: 1, savingsGoalId: "g1" })), "goalWithdrawal");
    assert.equal(classify(entry({ type: "TRANSFER", amount: 1, savingsGoalId: "g1" })), "goalContribution");
  });

  it("charges the budget for spending and earmarking, but not for reserve spending", () => {
    assert.equal(countsAgainstBudget("expense"), true);
    assert.equal(countsAgainstBudget("fundContribution"), true);
    assert.equal(countsAgainstBudget("fundExpense"), false);
    assert.equal(countsAgainstBudget("goalWithdrawal"), false);
    assert.equal(countsAgainstBudget("investment"), false);
    assert.equal(countsAgainstBudget("accountTransfer"), false);
  });
});

describe("summarise", () => {
  const entries: LedgerEntry[] = [
    entry({ type: "INCOME", amount: 24_000 }),
    entry({ type: "EXPENSE", amount: 3_000 }), // food
    entry({ type: "EXPENSE", amount: 1_785 }), // gym
    entry({ type: "TRANSFER", amount: 900, futureFundId: "vehicle" }),
    entry({ type: "TRANSFER", amount: 500, futureFundId: "health" }),
    entry({ type: "TRANSFER", amount: 3_000, savingsGoalId: "emergency" }),
    entry({ type: "INVESTMENT", amount: 2_504, investmentId: "sip" }),
    entry({ type: "TRANSFER", amount: 5_000 }), // bank -> cash, neutral
    entry({ type: "EXPENSE", amount: 2_500, futureFundId: "vehicle" }), // servicing
  ];

  const summary = summarise(entries);

  it("sums each bucket independently", () => {
    assert.equal(summary.income, 24_000);
    assert.equal(summary.expenses, 4_785);
    assert.equal(summary.fundContributions, 1_400);
    assert.equal(summary.goalContributions, 3_000);
    assert.equal(summary.investments, 2_504);
    assert.equal(summary.fundExpenses, 2_500);
    assert.equal(summary.accountTransfers, 5_000);
  });

  it("counts spending as everyday expenses plus money earmarked", () => {
    assert.equal(summary.spent, 4_785 + 1_400);
  });

  it("does not charge reserve-financed spending twice", () => {
    // The 2,500 servicing bill is reported, but not added to `spent` — the
    // money was already counted when it was contributed to the fund.
    assert.equal(summary.spent, 6_185);
    assert.ok(summary.fundExpenses > 0);
  });

  it("never counts a plain account transfer", () => {
    assert.equal(summary.allocated, 6_185 + 2_504 + 3_000);
    assert.equal(summary.remaining, 24_000 - summary.allocated);
  });

  it("partitions income exactly: spent + invested + saved + remaining = income", () => {
    const total = summary.spent + summary.investments + summary.saved + summary.remaining;
    assert.equal(total, summary.income);
  });

  it("reports a savings rate from what was not consumed", () => {
    assert.equal(summary.savingsRate, Math.round(((3_000 + summary.remaining) / 24_000) * 10_000) / 100);
  });

  it("returns zeroes for an empty month rather than NaN", () => {
    const empty = summarise([]);
    assert.equal(empty.income, 0);
    assert.equal(empty.spent, 0);
    assert.equal(empty.savingsRate, 0);
    assert.equal(empty.transactionCount, 0);
  });
});

describe("categoryActuals", () => {
  it("adds up per-category spending", () => {
    const totals = categoryActuals([
      entry({ type: "EXPENSE", amount: 400, categoryId: "food" }),
      entry({ type: "EXPENSE", amount: 350, categoryId: "food" }),
      entry({ type: "TRANSFER", amount: 900, categoryId: "vehicle", futureFundId: "vehicle" }),
    ]);

    assert.equal(totals.get("food"), 750);
    assert.equal(totals.get("vehicle"), 900);
  });

  it("excludes income and neutral transfers", () => {
    const totals = categoryActuals([
      entry({ type: "INCOME", amount: 24_000, categoryId: "salary" }),
      entry({ type: "TRANSFER", amount: 5_000, categoryId: "misc" }),
    ]);

    assert.equal(totals.has("salary"), false);
    assert.equal(totals.has("misc"), false);
  });

  it("excludes reserve-financed spending so a fund line is not double-charged", () => {
    const totals = categoryActuals([
      entry({ type: "TRANSFER", amount: 900, categoryId: "vehicle", futureFundId: "vehicle" }),
      entry({ type: "EXPENSE", amount: 2_500, categoryId: "vehicle", futureFundId: "vehicle" }),
    ]);

    assert.equal(totals.get("vehicle"), 900);
  });
});
