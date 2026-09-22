import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildBudgetLine, budgetTotals, carriedInFor, carryForwardByMonth } from "@/lib/calculations/budget";
import { monthRange, toMonthKey } from "@/lib/month";

function line(planned: number, actual: number, carriedIn = 0, carryForward = false) {
  return buildBudgetLine({
    categoryId: "c",
    categoryName: "Food",
    kind: "EXPENSE",
    color: "#2a78d6",
    icon: "Circle",
    carryForward,
    planned,
    actual,
    carriedIn,
  });
}

describe("buildBudgetLine", () => {
  it("reports progress against the plan", () => {
    const result = line(3_000, 2_750);
    assert.equal(result.available, 3_000);
    assert.equal(result.remaining, 250);
    assert.equal(result.rawProgress, 91.67);
    assert.equal(result.isOver, false);
  });

  it("calls out overspending with the exact amount", () => {
    const result = line(3_000, 3_450);
    assert.equal(result.isOver, true);
    assert.equal(result.overBy, 450);
    assert.equal(result.remaining, -450);
    // The bar is capped so it cannot render past the track.
    assert.equal(result.progress, 100);
    assert.equal(result.rawProgress, 115);
  });

  it("adds carried-in balance to what a rolling category can spend", () => {
    const result = line(4_000, 3_500, 2_500, true);
    assert.equal(result.available, 6_500);
    assert.equal(result.remaining, 3_000);
    assert.equal(result.isOver, false);
  });

  it("treats spending with no plan as fully over", () => {
    const result = line(0, 500);
    assert.equal(result.rawProgress, 100);
    assert.equal(result.isOver, true);
  });
});

describe("budgetTotals", () => {
  it("adds up planned and actual and counts the categories over", () => {
    const totals = budgetTotals([line(3_000, 2_750), line(1_785, 1_785), line(200, 450)]);
    assert.equal(totals.planned, 4_985);
    assert.equal(totals.actual, 4_985);
    assert.equal(totals.overCount, 1);
  });
});

describe("carry-forward", () => {
  const months = monthRange(new Date(Date.UTC(2026, 8, 1)), new Date(Date.UTC(2026, 10, 1)));

  it("rolls what was not spent into the next month", () => {
    // September: allocate 4,000, spend 1,500 -> October carries in 2,500.
    const allocations: Record<string, number> = { "2026-09": 4_000, "2026-10": 4_000, "2026-11": 4_000 };
    const spending: Record<string, number> = { "2026-09": 1_500, "2026-10": 3_500, "2026-11": 0 };

    const carried = carryForwardByMonth(
      months,
      (month) => allocations[toMonthKey(month)] ?? 0,
      (month) => spending[toMonthKey(month)] ?? 0,
      toMonthKey,
    );

    assert.equal(carried.get("2026-09"), 0);
    assert.equal(carried.get("2026-10"), 2_500);
    // October: 2,500 carried in + 4,000 allocated = 6,500 available, 3,500 spent.
    assert.equal(carried.get("2026-11"), 3_000);
  });

  it("carries an overspend forward as a negative rather than hiding it", () => {
    const carried = carryForwardByMonth(
      months,
      () => 1_000,
      (month) => (toMonthKey(month) === "2026-09" ? 2_500 : 0),
      toMonthKey,
    );

    assert.equal(carried.get("2026-10"), -1_500);
    assert.equal(carried.get("2026-11"), -500);
  });

  it("gives the balance for a single month", () => {
    const carriedIn = carriedInFor(
      months,
      new Date(Date.UTC(2026, 9, 1)),
      () => 4_000,
      (month) => (toMonthKey(month) === "2026-09" ? 1_500 : 0),
      toMonthKey,
    );

    assert.equal(carriedIn, 2_500);
  });

  it("starts at zero when there is no history", () => {
    const carried = carryForwardByMonth([], () => 0, () => 0, toMonthKey);
    assert.equal(carried.size, 0);
  });
});
