import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  addMonths,
  daysInMonth,
  formatMonthLabel,
  isSameMonth,
  monthEnd,
  monthRange,
  monthStart,
  parseDateKey,
  parseMonthKey,
  quarterOf,
  toDateKey,
  toMonthKey,
} from "@/lib/month";

describe("month boundaries", () => {
  it("pins a month to UTC midnight on the first", () => {
    const start = monthStart(new Date(Date.UTC(2026, 8, 22, 18, 30)));
    assert.equal(start.toISOString(), "2026-09-01T00:00:00.000Z");
  });

  it("uses an exclusive upper bound so a range never overlaps", () => {
    assert.equal(monthEnd(new Date(Date.UTC(2026, 8, 1))).toISOString(), "2026-10-01T00:00:00.000Z");
  });

  it("crosses a year boundary correctly", () => {
    assert.equal(toMonthKey(addMonths(new Date(Date.UTC(2026, 11, 1)), 1)), "2027-01");
    assert.equal(toMonthKey(addMonths(new Date(Date.UTC(2026, 0, 1)), -1)), "2025-12");
  });

  it("knows how long each month is, including leap years", () => {
    assert.equal(daysInMonth(new Date(Date.UTC(2026, 1, 1))), 28);
    assert.equal(daysInMonth(new Date(Date.UTC(2028, 1, 1))), 29);
    assert.equal(daysInMonth(new Date(Date.UTC(2026, 8, 1))), 30);
  });
});

describe("parsing", () => {
  it("round-trips a month key", () => {
    assert.equal(toMonthKey(parseMonthKey("2026-09")), "2026-09");
  });

  it("falls back to the current month rather than throwing on bad input", () => {
    for (const bad of ["", "nonsense", "2026-13", "2026-00", "20260909", null, undefined]) {
      const parsed = parseMonthKey(bad as string | null | undefined);
      assert.ok(parsed instanceof Date && !Number.isNaN(parsed.getTime()));
    }
  });

  it("rejects dates that do not exist", () => {
    assert.equal(parseDateKey("2026-02-30"), null);
    assert.equal(parseDateKey("2026-13-01"), null);
    assert.equal(parseDateKey("not-a-date"), null);
  });

  it("round-trips a date key at UTC midnight", () => {
    const date = parseDateKey("2026-09-22");
    assert.ok(date);
    assert.equal(date.toISOString(), "2026-09-22T00:00:00.000Z");
    assert.equal(toDateKey(date), "2026-09-22");
  });
});

describe("ranges", () => {
  it("lists months inclusively", () => {
    const months = monthRange(new Date(Date.UTC(2026, 6, 1)), new Date(Date.UTC(2026, 8, 1)));
    assert.deepEqual(months.map(toMonthKey), ["2026-07", "2026-08", "2026-09"]);
  });

  it("returns nothing for an inverted range instead of looping forever", () => {
    const months = monthRange(new Date(Date.UTC(2026, 8, 1)), new Date(Date.UTC(2026, 6, 1)));
    assert.equal(months.length, 0);
  });

});

describe("labels and quarters", () => {
  it("formats a month for people", () => {
    assert.equal(formatMonthLabel(new Date(Date.UTC(2026, 8, 1))), "September 2026");
  });

  it("compares months ignoring the day", () => {
    assert.ok(isSameMonth(new Date(Date.UTC(2026, 8, 1)), new Date(Date.UTC(2026, 8, 30))));
    assert.ok(!isSameMonth(new Date(Date.UTC(2026, 8, 1)), new Date(Date.UTC(2026, 9, 1))));
  });

  it("maps months to quarters", () => {
    assert.equal(quarterOf(new Date(Date.UTC(2026, 0, 1))), 1);
    assert.equal(quarterOf(new Date(Date.UTC(2026, 8, 1))), 3);
    assert.equal(quarterOf(new Date(Date.UTC(2026, 11, 1))), 4);
  });
});
