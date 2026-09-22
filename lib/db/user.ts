import { cache } from "react";

import { prisma } from "@/lib/db/prisma";
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
  DEFAULT_FUTURE_FUNDS,
  DEFAULT_INVESTMENTS,
  DEFAULT_MONTHLY_INCOME,
  DEFAULT_SAVINGS_GOALS,
} from "@/lib/db/defaults";

/**
 * Single-user mode.
 *
 * Every row in the schema already hangs off a `userId`, so adding real auth
 * later means replacing the body of `getCurrentUserId()` with a session lookup —
 * no query, action or component below this file needs to change.
 *
 * The id is deterministic so concurrent cold starts upsert the same row instead
 * of racing to create two users.
 */
export const SINGLE_USER_ID = "primary";

export type CurrentUser = {
  id: string;
  name: string;
  currency: string;
  locale: string;
  defaultMonthlyIncome: number;
  demoDataLoaded: boolean;
};

/** Create the user plus its starter categories, accounts, funds and goals. */
async function bootstrapUser(): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { id: SINGLE_USER_ID } });
    if (existing) return;

    await tx.user.create({
      data: {
        id: SINGLE_USER_ID,
        name: "You",
        settings: {
          create: { defaultMonthlyIncome: DEFAULT_MONTHLY_INCOME },
        },
        accounts: { create: DEFAULT_ACCOUNTS },
        savingsGoals: { create: DEFAULT_SAVINGS_GOALS },
        investments: { create: DEFAULT_INVESTMENTS },
      },
    });

    await tx.category.createMany({
      data: DEFAULT_CATEGORIES.map((category) => ({ ...category, userId: SINGLE_USER_ID })),
    });

    // Each sinking fund gets a linked category so it can be budgeted like any
    // other line on the Budget page.
    for (const fund of DEFAULT_FUTURE_FUNDS) {
      const created = await tx.futureFund.create({
        data: { ...fund, userId: SINGLE_USER_ID },
      });
      await tx.category.create({
        data: {
          userId: SINGLE_USER_ID,
          name: fund.name,
          kind: "FUTURE_FUND",
          color: fund.color,
          icon: fund.icon,
          sortOrder: 50 + fund.sortOrder,
          futureFundId: created.id,
        },
      });
    }
  });
}

/**
 * Load (and if necessary create) the workspace. Exported uncached so scripts
 * outside a React render — the seed, for one — can call it directly.
 */
export async function loadCurrentUser(): Promise<CurrentUser> {
  let record = await prisma.user.findUnique({
    where: { id: SINGLE_USER_ID },
    include: { settings: true },
  });

  if (!record) {
    await bootstrapUser();
    record = await prisma.user.findUnique({
      where: { id: SINGLE_USER_ID },
      include: { settings: true },
    });
  }

  if (!record) {
    throw new Error("Could not initialise the workspace. Check your DATABASE_URL.");
  }

  const settings =
    record.settings ??
    (await prisma.userSettings.create({
      data: { userId: record.id, defaultMonthlyIncome: DEFAULT_MONTHLY_INCOME },
    }));

  return {
    id: record.id,
    name: record.name,
    currency: settings.currency,
    locale: settings.locale,
    defaultMonthlyIncome: Number(settings.defaultMonthlyIncome),
    demoDataLoaded: settings.demoDataLoaded,
  };
}

/**
 * The current user. `cache` de-duplicates the lookup across a single server
 * render, so every component can ask for it without extra queries.
 */
export const getCurrentUser = cache(loadCurrentUser);

export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser();
  return user.id;
}
