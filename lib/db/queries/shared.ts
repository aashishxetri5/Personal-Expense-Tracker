import { prisma } from "@/lib/db/prisma";
import { toNumber } from "@/lib/format";
import { monthEnd, monthStart, toDateKey } from "@/lib/month";
import type { LedgerEntry } from "@/lib/types";

/** Columns the calculation layer needs — nothing more travels over the wire. */
export const LEDGER_SELECT = {
  type: true,
  amount: true,
  date: true,
  categoryId: true,
  futureFundId: true,
  savingsGoalId: true,
  investmentId: true,
} as const;

type RawLedgerRow = {
  type: LedgerEntry["type"];
  amount: unknown;
  date: Date;
  categoryId: string | null;
  futureFundId: string | null;
  savingsGoalId: string | null;
  investmentId: string | null;
};

export function toLedgerEntry(row: RawLedgerRow): LedgerEntry {
  return {
    type: row.type,
    amount: toNumber(row.amount),
    date: row.date,
    categoryId: row.categoryId,
    futureFundId: row.futureFundId,
    savingsGoalId: row.savingsGoalId,
    investmentId: row.investmentId,
  };
}

/** Every transaction inside a single month. */
export async function ledgerForMonth(userId: string, month: Date): Promise<LedgerEntry[]> {
  const rows = await prisma.transaction.findMany({
    where: { userId, date: { gte: monthStart(month), lt: monthEnd(month) } },
    select: LEDGER_SELECT,
  });
  return rows.map(toLedgerEntry);
}

/** Every transaction up to and including a month — used for running balances. */
export async function ledgerThroughMonth(userId: string, month: Date): Promise<LedgerEntry[]> {
  const rows = await prisma.transaction.findMany({
    where: { userId, date: { lt: monthEnd(month) } },
    select: LEDGER_SELECT,
  });
  return rows.map(toLedgerEntry);
}

/** Every transaction inside an inclusive month range. */
export async function ledgerForRange(userId: string, from: Date, to: Date): Promise<LedgerEntry[]> {
  const rows = await prisma.transaction.findMany({
    where: { userId, date: { gte: monthStart(from), lt: monthEnd(to) } },
    select: LEDGER_SELECT,
  });
  return rows.map(toLedgerEntry);
}

export function dateKeyOrNull(value: Date | null | undefined): string | null {
  return value ? toDateKey(value) : null;
}
