# Finance

A personal money manager: budgets, sinking funds, savings goals, investments and
net worth, kept in one PostgreSQL database you can browse month by month.

Built as a single-user app, but every row already hangs off a `userId`, so
authentication can be added later without reshaping the data model.

---

## Quick start

```bash
npm install
cp .env.example .env          # then set DATABASE_URL
npx prisma generate           # build the typed client (it is not committed)
npx prisma migrate deploy     # create the tables
npm run db:seed               # optional: eight months of demo data
npm run dev                   # http://localhost:3000
```

The workspace bootstraps itself on first load: default categories, payment
methods, sinking funds, an emergency fund and an SIP are created for you. All of
them are editable from **Settings** — nothing is hardcoded.

---

## 1. Requirements

| Tool       | Version                                   |
| ---------- | ----------------------------------------- |
| Node.js    | 20.9 or newer (developed on 24)           |
| PostgreSQL | 14 or newer (developed on 18)             |
| npm        | 10 or newer                               |

## 2. Environment setup

Copy `.env.example` to `.env` and fill in one variable:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/expense_tracker?schema=public"
```

`SHADOW_DATABASE_URL` is optional and only used locally by `prisma migrate dev`
when you change the schema. Never set it in production.

`.env` is gitignored. Do not commit it.

## 3. Database setup

Create a database, then point `DATABASE_URL` at it:

```bash
createdb expense_tracker
# or: psql -U postgres -c "CREATE DATABASE expense_tracker;"
```

No local Postgres? Prisma ships a throwaway one:

```bash
npx prisma dev -d -n expense-tracker   # starts it
npx prisma dev ls                      # prints the connection string
```

## 4. Migrations

```bash
npx prisma generate         # regenerate the typed client after a schema change
npx prisma migrate deploy   # apply existing migrations (use this in CI/production)
npm run db:migrate          # create a new migration after editing schema.prisma
```

The generated Prisma client lives in `lib/generated/` and is deliberately not
committed, so run `prisma generate` after cloning and after any schema change.
`npm run build` does it for you.

## 5. Seed data

```bash
npm run db:seed
```

Creates eight months of realistic history: salary, groceries, fuel, gym, an SIP,
monthly contributions into four sinking funds, an emergency fund, a couple of
bills paid out of reserves, a budget per month and a net-worth snapshot per
month.

Every seeded row is flagged `isDemo`, so **Settings → Danger zone → Remove demo
data** deletes all of it and leaves anything you entered yourself untouched.
Re-running the seed replaces the previous demo data rather than duplicating it.

## 6. Local development

```bash
npm run dev         # dev server
npm run build       # production build (runs prisma generate first)
npm run start       # serve the production build
npm run typecheck   # tsc --noEmit
npm run test        # unit tests for the financial logic
npm run verify      # end-to-end checks against your database (scenarios + actions)
npm run db:studio   # browse the data in Prisma Studio
```

`npm run verify` runs two suites. `verify:scenarios` writes a handful of rows and
asserts the outcome through the same query layer the pages read from.
`verify:actions` calls the server actions the UI calls, covering validation,
ownership checks and the writes themselves. Both clean up after themselves and
are safe to run against a database with real data in it.

## 7. Deploying to Vercel

1. Push the repository to GitHub.
2. **Import Project** in Vercel and pick the repo.
3. Create a Postgres database (Vercel Postgres, Neon, Supabase or Prisma
   Postgres) and copy its **pooled** connection string.
4. Add one environment variable in **Project → Settings → Environment
   Variables**:

   | Name           | Value                        |
   | -------------- | ---------------------------- |
   | `DATABASE_URL` | your pooled connection string |

5. Deploy. The build script runs `prisma generate` automatically.
6. Apply the schema once, from your machine, with the production URL:

   ```bash
   DATABASE_URL="<production url>" npx prisma migrate deploy
   ```

   Or add it to the build command if you prefer migrations to run on deploy:
   `prisma migrate deploy && prisma generate && next build`.

Optionally seed the demo data the same way:

```bash
DATABASE_URL="<production url>" npm run db:seed
```

Use a **pooled** connection string. Serverless functions open many short-lived
connections, and a direct connection will exhaust the database's limit.

---

## How the money maths works

This is the part worth reading. The single biggest failure mode in a finance app
is counting the same rupee twice, so the rules are explicit and tested.

`Transaction` is the only ledger. Fund balances, goal progress and investment
totals are all **derived** from it rather than stored as counters, so a balance
can never disagree with the transactions that produced it.

Every transaction is classified into exactly one bucket:

| Transaction              | Bucket             | Counted as                            |
| ------------------------ | ------------------ | ------------------------------------- |
| Income                   | `income`           | Money in                              |
| Expense                  | `expense`          | Spending, charged to the month        |
| Expense → future fund    | `fundExpense`      | Spending **from a reserve**           |
| Expense → savings goal   | `goalWithdrawal`   | Spending **from a goal**              |
| Transfer → future fund   | `fundContribution` | Money earmarked, charged to the month |
| Transfer → savings goal  | `goalContribution` | Saved                                 |
| Investment               | `investment`       | Invested, **not** spending            |
| Transfer → other account | `accountTransfer`  | Nothing — neutral                     |

The headline figures follow from that:

```
Spent     = everyday expenses + money earmarked into future funds
Invested  = investment transactions
Saved     = contributions into savings goals and the emergency fund
Remaining = Income - Spent - Invested - Saved
```

which means income is **partitioned exactly**:

```
Spent + Invested + Saved + Remaining = Income
```

There is a unit test asserting precisely that.

### Why reserve spending is not charged twice

Put NPR 900 a month into the Vehicle fund and it counts as spending in the month
you set it aside. When the NPR 2,500 servicing bill arrives and you pay it *from
the fund*, it does **not** count again — the money was already accounted for.
The bill still appears everywhere, as "paid from reserves", and it draws the fund
balance down. Charging it twice would make a careful month look reckless.

### Carry-forward allowances

A category can be marked **rolls over** (Lifestyle / Personal is, by default).
Its allocation is a ceiling, not a quota:

```
September   allocated 4,000   spent 1,500   →   2,500 rolls over
October     carried in 2,500 + allocated 4,000 = 6,500 available
```

Overspending rolls forward too, as a negative — the money came from somewhere,
and hiding that would quietly inflate next month. The balance is recomputed from
history every time rather than stored, so correcting a past month automatically
corrects everything after it.

### Historical integrity

Budgets are one `MonthlyBudget` row per month, with their own `BudgetItem`s.
Editing October's Food budget **cannot** reach September, because they are
different rows. That is a structural guarantee, not a convention — and it is
covered by `npm run verify`.

---

## Project structure

```
app/
  (app)/              the authenticated shell: sidebar, top bar, month selector
    page.tsx            dashboard
    transactions/       searchable, filterable, paginated history
    budget/             per-month plan + tracking
    future-funds/       sinking funds
    savings/            savings goals and the emergency fund
    investments/        contributions over time
    net-worth/          monthly snapshots
    history/            every month, preserved
    reports/            monthly / quarterly / yearly
    settings/           profile, categories, payment methods, data
  api/export/         CSV and JSON downloads

components/
  charts/             Recharts wrappers + the shared chart furniture
  dashboard/  budget/  funds/  savings/  investments/  networth/
  transactions/       the add/edit dialog, list, and filters
  settings/
  ui/                 buttons, dialogs, selects, tables, empty states

lib/
  calculations/       pure, tested money logic (ledger, budget, balances)
  db/
    prisma.ts           client singleton with the pg driver adapter
    queries/            all reads, one module per screen
    defaults.ts         the starter category/fund/goal set
  validations/        Zod schemas shared by forms and server actions
  actions/            server actions — every mutation in the app
  month.ts            UTC month helpers
  format.ts           currency and number formatting
  chart-colors.ts     the validated categorical palette

prisma/
  schema.prisma
  migrations/
  seed.ts

scripts/
  verify-scenarios.ts
```

## Data model

```
User ─┬─ UserSettings
      ├─ Account            cash, bank, eSewa, Khalti, card
      ├─ Category ──────────┐ (a category may front a FutureFund)
      ├─ Transaction ───────┴─ categoryId, accountId, futureFundId,
      │                        savingsGoalId, investmentId
      ├─ MonthlyBudget ──── BudgetItem   (one record per month)
      ├─ FutureFund
      ├─ SavingsGoal
      ├─ Investment
      └─ NetWorthSnapshot ── NetWorthEntry
```

Indexed on `Transaction.date`, `(type, date)`, `(categoryId, date)`, the reserve
links, and `MonthlyBudget.month`.

## Exporting your data

From **Settings → Export**, or directly:

| Endpoint                          | Contents                       |
| --------------------------------- | ------------------------------ |
| `/api/export/transactions?all=1`  | Every transaction, CSV         |
| `/api/export/history`             | Month-by-month totals, CSV     |
| `/api/export/budget`              | Every month's plan, CSV        |
| `/api/export/backup`              | Everything, JSON               |

## Notes on security

- Every server action validates its input with Zod before touching the database.
- Client-supplied ids are checked for ownership before they are written.
- All queries go through Prisma; nothing is string-concatenated into SQL.
- Database credentials live in `DATABASE_URL` only, and `.env` is gitignored.
- Destructive actions require confirmation; wiping all data requires typing
  `DELETE`.

## Accessibility and theming

Light, dark and system themes. The chart palette is validated as a set — for
lightness, chroma, contrast, and separation under the common colour-vision
deficiencies — and has a separate set of steps chosen for the dark surface rather
than an automatic inversion. Every chart ships a legend with values and a
screen-reader table, so no figure is conveyed by colour alone.

## Currency

NPR by default, and configurable from Settings. All formatting goes through
`lib/format.ts`, so changing the currency reformats every figure in the app.
