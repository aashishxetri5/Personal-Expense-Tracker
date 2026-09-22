import { prisma } from "@/lib/db/prisma";
import { toNumber } from "@/lib/format";
import { monthEnd, monthStart, parseDateKey, parseMonthKey, toDateKey } from "@/lib/month";
import type { TransactionDTO } from "@/lib/types";
import type { TransactionFilter } from "@/lib/validations/transaction";
import type { Prisma } from "@/lib/generated/prisma/client";

const TRANSACTION_INCLUDE = {
  category: { select: { id: true, name: true, kind: true, color: true, icon: true } },
  account: { select: { id: true, name: true, kind: true } },
  transferAccount: { select: { id: true, name: true } },
  futureFund: { select: { id: true, name: true, color: true } },
  savingsGoal: { select: { id: true, name: true, color: true } },
  investment: { select: { id: true, name: true } },
} satisfies Prisma.TransactionInclude;

type TransactionRow = Prisma.TransactionGetPayload<{ include: typeof TRANSACTION_INCLUDE }>;

export function toTransactionDTO(row: TransactionRow): TransactionDTO {
  return {
    id: row.id,
    type: row.type,
    amount: toNumber(row.amount),
    date: toDateKey(row.date),
    description: row.description,
    notes: row.notes,
    isDemo: row.isDemo,
    category: row.category,
    account: row.account,
    transferAccount: row.transferAccount,
    futureFund: row.futureFund,
    savingsGoal: row.savingsGoal,
    investment: row.investment,
  };
}

function buildWhere(userId: string, filter: TransactionFilter): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = { userId };

  if (filter.month) {
    const month = parseMonthKey(filter.month);
    where.date = { gte: monthStart(month), lt: monthEnd(month) };
  } else if (filter.from || filter.to) {
    const from = parseDateKey(filter.from ?? null);
    const to = parseDateKey(filter.to ?? null);
    where.date = {
      ...(from ? { gte: from } : {}),
      // `to` is inclusive for the user, exclusive for the query.
      ...(to ? { lt: new Date(to.getTime() + 24 * 60 * 60 * 1000) } : {}),
    };
  }

  if (filter.type) where.type = filter.type;
  if (filter.categoryId) where.categoryId = filter.categoryId;
  if (filter.accountId) where.accountId = filter.accountId;
  if (filter.futureFundId) where.futureFundId = filter.futureFundId;

  if (filter.search) {
    where.OR = [
      { description: { contains: filter.search, mode: "insensitive" } },
      { notes: { contains: filter.search, mode: "insensitive" } },
      { category: { name: { contains: filter.search, mode: "insensitive" } } },
      { futureFund: { name: { contains: filter.search, mode: "insensitive" } } },
      { savingsGoal: { name: { contains: filter.search, mode: "insensitive" } } },
    ];
  }

  return where;
}

function buildOrderBy(sort: TransactionFilter["sort"]): Prisma.TransactionOrderByWithRelationInput[] {
  switch (sort) {
    case "date-asc":
      return [{ date: "asc" }, { createdAt: "asc" }];
    case "amount-desc":
      return [{ amount: "desc" }, { date: "desc" }];
    case "amount-asc":
      return [{ amount: "asc" }, { date: "desc" }];
    case "date-desc":
    default:
      return [{ date: "desc" }, { createdAt: "desc" }];
  }
}

export type TransactionPage = {
  rows: TransactionDTO[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  /** Net of the filtered set: income minus everything that left the wallet. */
  totals: { income: number; outflow: number };
};

export async function getTransactionPage(
  userId: string,
  filter: TransactionFilter,
): Promise<TransactionPage> {
  const where = buildWhere(userId, filter);
  const pageSize = filter.pageSize;

  const [total, grouped] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.groupBy({ by: ["type"], where, _sum: { amount: true } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(filter.page, pageCount);

  const rows = await prisma.transaction.findMany({
    where,
    include: TRANSACTION_INCLUDE,
    orderBy: buildOrderBy(filter.sort),
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  let income = 0;
  let outflow = 0;
  for (const group of grouped) {
    const amount = toNumber(group._sum.amount);
    if (group.type === "INCOME") income += amount;
    else if (group.type !== "TRANSFER") outflow += amount;
  }

  return {
    rows: rows.map(toTransactionDTO),
    total,
    page,
    pageSize,
    pageCount,
    totals: { income, outflow },
  };
}

export async function getTransactionById(
  userId: string,
  id: string,
): Promise<TransactionDTO | null> {
  const row = await prisma.transaction.findFirst({
    where: { id, userId },
    include: TRANSACTION_INCLUDE,
  });
  return row ? toTransactionDTO(row) : null;
}

/** Recent activity for the dashboard. */
export async function getRecentTransactions(
  userId: string,
  month: Date,
  take = 6,
): Promise<TransactionDTO[]> {
  const rows = await prisma.transaction.findMany({
    where: { userId, date: { gte: monthStart(month), lt: monthEnd(month) } },
    include: TRANSACTION_INCLUDE,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take,
  });
  return rows.map(toTransactionDTO);
}

/** Every matching transaction, unpaginated — used by CSV/JSON export only. */
export async function getTransactionsForExport(
  userId: string,
  filter: TransactionFilter,
): Promise<TransactionDTO[]> {
  const rows = await prisma.transaction.findMany({
    where: buildWhere(userId, filter),
    include: TRANSACTION_INCLUDE,
    orderBy: buildOrderBy(filter.sort),
    take: 20_000,
  });
  return rows.map(toTransactionDTO);
}
