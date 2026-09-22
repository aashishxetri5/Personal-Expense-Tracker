import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  balanceOf,
  fundMovements,
  goalMovements,
  investmentTotals,
  monthsToTarget,
  netWorthTotals,
  progressOf,
} from "@/lib/calculations/balances";
import type { LedgerEntry } from "@/lib/types";

const DATE = new Date(Date.UTC(2026, 8, 15));

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

describe("fund balances", () => {
  const entries = [
    entry({ type: "TRANSFER", amount: 900, futureFundId: "vehicle" }),
    entry({ type: "TRANSFER", amount: 900, futureFundId: "vehicle" }),
    entry({ type: "EXPENSE", amount: 500, futureFundId: "vehicle" }),
    entry({ type: "TRANSFER", amount: 500, futureFundId: "health" }),
  ];

  it("nets contributions against spending", () => {
    const movements = fundMovements(entries);
    assert.deepEqual(movements.get("vehicle"), { contributions: 1_800, withdrawals: 500 });
    assert.equal(balanceOf(0, movements.get("vehicle")), 1_300);
  });

  it("includes money that was already set aside before tracking", () => {
    const movements = fundMovements(entries);
    assert.equal(balanceOf(2_000, movements.get("health")), 2_500);
  });

  it("falls back to the opening balance for an untouched fund", () => {
    assert.equal(balanceOf(750, undefined), 750);
  });
});

describe("goal balances", () => {
  it("nets contributions against withdrawals", () => {
    const movements = goalMovements([
      entry({ type: "TRANSFER", amount: 3_000, savingsGoalId: "emergency" }),
      entry({ type: "TRANSFER", amount: 3_000, savingsGoalId: "emergency" }),
      entry({ type: "EXPENSE", amount: 1_000, savingsGoalId: "emergency" }),
    ]);

    assert.equal(balanceOf(0, movements.get("emergency")), 5_000);
  });
});

describe("investment totals", () => {
  it("counts only investment transactions", () => {
    const totals = investmentTotals([
      entry({ type: "INVESTMENT", amount: 2_504, investmentId: "sip" }),
      entry({ type: "INVESTMENT", amount: 2_504, investmentId: "sip" }),
      entry({ type: "EXPENSE", amount: 500, investmentId: "sip" }),
    ]);

    assert.equal(totals.get("sip"), 5_008);
  });
});

describe("progress", () => {
  it("is a percentage of the target, capped at 100", () => {
    assert.equal(progressOf(24_000, 75_000), 32);
    assert.equal(progressOf(80_000, 75_000), 100);
  });

  it("handles a goal with no target", () => {
    assert.equal(progressOf(0, 0), 0);
    assert.equal(progressOf(500, 0), 100);
  });

  it("estimates the months still needed", () => {
    assert.equal(monthsToTarget(24_000, 75_000, 3_000), 17);
    assert.equal(monthsToTarget(75_000, 75_000, 3_000), null);
    assert.equal(monthsToTarget(0, 75_000, 0), null);
  });
});

describe("net worth", () => {
  it("is assets minus liabilities", () => {
    const totals = netWorthTotals([
      { kind: "ASSET", amount: 40_000 },
      { kind: "ASSET", amount: 20_032 },
      { kind: "LIABILITY", amount: 12_000 },
    ]);

    assert.deepEqual(totals, { assets: 60_032, liabilities: 12_000, netWorth: 48_032 });
  });

  it("can be negative", () => {
    const totals = netWorthTotals([
      { kind: "ASSET", amount: 5_000 },
      { kind: "LIABILITY", amount: 9_000 },
    ]);

    assert.equal(totals.netWorth, -4_000);
  });
});
