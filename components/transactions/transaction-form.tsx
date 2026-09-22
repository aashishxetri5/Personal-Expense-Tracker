"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftRight, Minus, Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { useMoney } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTransaction, updateTransaction } from "@/lib/actions/transactions";
import type { FormOptions } from "@/lib/db/queries/reference";
import { toDateKey, today } from "@/lib/month";
import type { TransactionDTO, TransactionType } from "@/lib/types";
import { transactionInputSchema, type TransactionInput } from "@/lib/validations/transaction";
import type { z } from "zod";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS: {
  value: TransactionType;
  label: string;
  icon: typeof Minus;
  hint: string;
  activeClass: string;
}[] = [
  {
    value: "EXPENSE",
    label: "Expense",
    icon: Minus,
    hint: "Money spent",
    activeClass: "bg-destructive/10 text-destructive ring-destructive/30",
  },
  {
    value: "INCOME",
    label: "Income",
    icon: Plus,
    hint: "Money received",
    activeClass: "bg-[var(--success)]/12 text-[var(--success)] ring-[var(--success)]/30",
  },
  {
    value: "INVESTMENT",
    label: "Investment",
    icon: TrendingUp,
    hint: "Money invested — not spending",
    activeClass: "bg-primary/10 text-primary ring-primary/30",
  },
  {
    value: "TRANSFER",
    label: "Transfer",
    icon: ArrowLeftRight,
    hint: "Move money into a fund, a goal or another account",
    activeClass: "bg-secondary text-secondary-foreground ring-border",
  },
];

/** Destination select encodes which kind of target was picked. */
const DESTINATION_PREFIX = { fund: "fund:", goal: "goal:", account: "account:" } as const;

const NONE = "__none__";

/**
 * The form works in the schema's *input* shape (amount arrives from the DOM as a
 * string, optional text as undefined). Zod coerces and normalises it into
 *  on submit, which is what the server action receives.
 */
type TransactionFormValues = z.input<typeof transactionInputSchema>;

function categoriesForType(options: FormOptions, type: TransactionType) {
  switch (type) {
    case "INCOME":
      return options.categories.filter((category) => category.kind === "INCOME");
    case "INVESTMENT":
      return options.categories.filter((category) => category.kind === "INVESTMENT");
    case "TRANSFER":
      return options.categories.filter(
        (category) => category.kind === "FUTURE_FUND" || category.kind === "SAVINGS",
      );
    case "EXPENSE":
    default:
      return options.categories.filter(
        (category) => category.kind === "EXPENSE" || category.kind === "FUTURE_FUND",
      );
  }
}

function toDefaults(
  transaction: TransactionDTO | null,
  defaultAccountId?: string,
): TransactionFormValues {
  if (!transaction) {
    return {
      type: "EXPENSE",
      // Empty rather than 0 so the field reads as blank; Zod rejects it on submit.
      amount: "" as unknown as number,
      date: toDateKey(today()),
      description: "",
      notes: undefined,
      categoryId: null,
      accountId: defaultAccountId ?? null,
      transferAccountId: null,
      futureFundId: null,
      savingsGoalId: null,
      investmentId: null,
    };
  }

  return {
    type: transaction.type,
    amount: transaction.amount,
    date: transaction.date,
    description: transaction.description,
    notes: transaction.notes ?? undefined,
    categoryId: transaction.category?.id ?? null,
    accountId: transaction.account?.id ?? null,
    transferAccountId: transaction.transferAccount?.id ?? null,
    futureFundId: transaction.futureFund?.id ?? null,
    savingsGoalId: transaction.savingsGoal?.id ?? null,
    investmentId: transaction.investment?.id ?? null,
  };
}

export function TransactionForm({
  options,
  transaction,
  defaultDate,
  onDone,
  onCancel,
}: {
  options: FormOptions;
  transaction: TransactionDTO | null;
  /** Pre-fill the date when adding from a month other than the current one. */
  defaultDate?: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const money = useMoney();
  const isEditing = transaction !== null;

  const form = useForm<TransactionFormValues, unknown, TransactionInput>({
    resolver: zodResolver(transactionInputSchema),
    defaultValues: {
      ...toDefaults(transaction, options.accounts[0]?.id),
      ...(transaction ? {} : defaultDate ? { date: defaultDate } : {}),
    },
    mode: "onSubmit",
  });

  const type = form.watch("type");
  const amountValue = Number(form.watch("amount") ?? 0);
  const futureFundId = form.watch("futureFundId");
  const savingsGoalId = form.watch("savingsGoalId");
  const transferAccountId = form.watch("transferAccountId");

  const categories = React.useMemo(() => categoriesForType(options, type), [options, type]);

  /** Switching type clears links that no longer make sense for it. */
  const handleTypeChange = (next: TransactionType) => {
    form.setValue("type", next);
    form.setValue("futureFundId", null);
    form.setValue("savingsGoalId", null);
    form.setValue("transferAccountId", null);
    form.setValue("investmentId", next === "INVESTMENT" ? (options.investments[0]?.id ?? null) : null);
    form.setValue("categoryId", null);
    form.clearErrors();

    if (next === "INVESTMENT") {
      const investmentCategory = options.categories.find((category) => category.kind === "INVESTMENT");
      if (investmentCategory) form.setValue("categoryId", investmentCategory.id);
    }
  };

  const destinationValue = futureFundId
    ? `${DESTINATION_PREFIX.fund}${futureFundId}`
    : savingsGoalId
      ? `${DESTINATION_PREFIX.goal}${savingsGoalId}`
      : transferAccountId
        ? `${DESTINATION_PREFIX.account}${transferAccountId}`
        : "";

  /** Picking a fund also selects its budget category, so the plan stays honest. */
  const handleDestinationChange = (value: string) => {
    form.setValue("futureFundId", null);
    form.setValue("savingsGoalId", null);
    form.setValue("transferAccountId", null);

    if (value.startsWith(DESTINATION_PREFIX.fund)) {
      const id = value.slice(DESTINATION_PREFIX.fund.length);
      form.setValue("futureFundId", id);
      const fund = options.futureFunds.find((item) => item.id === id);
      if (fund?.categoryId) form.setValue("categoryId", fund.categoryId);
    } else if (value.startsWith(DESTINATION_PREFIX.goal)) {
      form.setValue("savingsGoalId", value.slice(DESTINATION_PREFIX.goal.length));
      const savingsCategory = options.categories.find((category) => category.kind === "SAVINGS");
      if (savingsCategory) form.setValue("categoryId", savingsCategory.id);
    } else if (value.startsWith(DESTINATION_PREFIX.account)) {
      form.setValue("transferAccountId", value.slice(DESTINATION_PREFIX.account.length));
      form.setValue("categoryId", null);
    }

    form.clearErrors(["transferAccountId", "futureFundId", "savingsGoalId"]);
  };

  const financedValue = futureFundId
    ? `${DESTINATION_PREFIX.fund}${futureFundId}`
    : savingsGoalId
      ? `${DESTINATION_PREFIX.goal}${savingsGoalId}`
      : NONE;

  const handleFinancedChange = (value: string) => {
    form.setValue("futureFundId", null);
    form.setValue("savingsGoalId", null);
    if (value.startsWith(DESTINATION_PREFIX.fund)) {
      form.setValue("futureFundId", value.slice(DESTINATION_PREFIX.fund.length));
    } else if (value.startsWith(DESTINATION_PREFIX.goal)) {
      form.setValue("savingsGoalId", value.slice(DESTINATION_PREFIX.goal.length));
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const result = isEditing
      ? await updateTransaction({ id: transaction.id, data: values })
      : await createTransaction(values);

    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          const name = field.replace(/^data\./, "") as keyof TransactionFormValues;
          form.setError(name, { message: messages[0] });
        }
      }
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Transaction updated" : "Transaction added", {
      description: `${money.format(values.amount)} · ${values.description || "No description"}`,
    });
    onDone();
  });

  const errors = form.formState.errors;

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <DialogBody className="space-y-4">
        {/* Type ------------------------------------------------------------ */}
        <fieldset>
          <legend className="sr-only">Transaction type</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TYPE_OPTIONS.map((option) => {
              const active = type === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleTypeChange(option.value)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-medium ring-1 transition-all",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    active
                      ? option.activeClass
                      : "bg-card text-muted-foreground ring-border hover:bg-muted hover:text-foreground",
                  )}
                >
                  <option.icon className="size-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {TYPE_OPTIONS.find((option) => option.value === type)?.hint}
          </p>
        </fieldset>

        {/* Amount + date --------------------------------------------------- */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" htmlFor="amount" required error={errors.amount?.message}>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                {money.currency}
              </span>
              <Input
                id="amount"
                inputMode="decimal"
                autoComplete="off"
                autoFocus
                placeholder="0"
                aria-invalid={Boolean(errors.amount)}
                className="pl-12 text-base font-semibold tabular"
                {...form.register("amount")}
              />
            </div>
          </Field>

          <Field label="Date" htmlFor="date" required error={errors.date?.message}>
            <Input id="date" type="date" aria-invalid={Boolean(errors.date)} {...form.register("date")} />
          </Field>
        </div>

        {/* Description ----------------------------------------------------- */}
        <Field label="Description" htmlFor="description" error={errors.description?.message}>
          <Input
            id="description"
            placeholder={type === "INCOME" ? "Salary" : "Fuel, groceries, gym…"}
            autoComplete="off"
            {...form.register("description")}
          />
        </Field>

        {/* Destination (transfers only) ------------------------------------ */}
        {type === "TRANSFER" ? (
          <Field
            label="Move money into"
            htmlFor="destination"
            required
            error={errors.transferAccountId?.message ?? errors.futureFundId?.message}
            hint="Transfers are not spending — they move money you already have."
          >
            <Select value={destinationValue} onValueChange={handleDestinationChange}>
              <SelectTrigger id="destination" aria-invalid={Boolean(errors.transferAccountId)}>
                <SelectValue placeholder="Choose a destination" />
              </SelectTrigger>
              <SelectContent>
                {options.futureFunds.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>Future funds</SelectLabel>
                    {options.futureFunds.map((fund) => (
                      <SelectItem key={fund.id} value={`${DESTINATION_PREFIX.fund}${fund.id}`}>
                        {fund.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null}
                {options.savingsGoals.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>Savings goals</SelectLabel>
                    {options.savingsGoals.map((goal) => (
                      <SelectItem key={goal.id} value={`${DESTINATION_PREFIX.goal}${goal.id}`}>
                        {goal.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null}
                {options.accounts.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>Accounts</SelectLabel>
                    {options.accounts.map((account) => (
                      <SelectItem key={account.id} value={`${DESTINATION_PREFIX.account}${account.id}`}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null}
              </SelectContent>
            </Select>
          </Field>
        ) : null}

        {/* Investment (investments only) ----------------------------------- */}
        {type === "INVESTMENT" ? (
          <Field label="Investment" htmlFor="investmentId" required error={errors.investmentId?.message}>
            <Controller
              control={form.control}
              name="investmentId"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger id="investmentId" aria-invalid={Boolean(errors.investmentId)}>
                    <SelectValue placeholder="Choose an investment" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.investments.map((investment) => (
                      <SelectItem key={investment.id} value={investment.id}>
                        {investment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        ) : null}

        {/* Category + payment method --------------------------------------- */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="categoryId" error={errors.categoryId?.message}>
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  value={field.value ?? NONE}
                  onValueChange={(value) => field.onChange(value === NONE ? null : value)}
                >
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Uncategorised" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Uncategorised</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Payment method" htmlFor="accountId" error={errors.accountId?.message}>
            <Controller
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <Select
                  value={field.value ?? NONE}
                  onValueChange={(value) => field.onChange(value === NONE ? null : value)}
                >
                  <SelectTrigger id="accountId">
                    <SelectValue placeholder="Not recorded" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Not recorded</SelectItem>
                    {options.accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        {/* Financed by (expenses only) ------------------------------------- */}
        {type === "EXPENSE" ? (
          <Field
            label="Paid from a reserve"
            htmlFor="financedBy"
            hint="Optional. Choose a fund or goal when this bill is what you have been saving for."
            error={errors.futureFundId?.message ?? errors.savingsGoalId?.message}
          >
            <Select value={financedValue} onValueChange={handleFinancedChange}>
              <SelectTrigger id="financedBy">
                <SelectValue placeholder="Paid from this month's budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>This month&apos;s budget</SelectItem>
                {options.futureFunds.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>Future funds</SelectLabel>
                    {options.futureFunds.map((fund) => (
                      <SelectItem key={fund.id} value={`${DESTINATION_PREFIX.fund}${fund.id}`}>
                        {fund.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null}
                {options.savingsGoals.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>Savings goals</SelectLabel>
                    {options.savingsGoals.map((goal) => (
                      <SelectItem key={goal.id} value={`${DESTINATION_PREFIX.goal}${goal.id}`}>
                        {goal.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null}
              </SelectContent>
            </Select>
          </Field>
        ) : null}

        {(type === "EXPENSE" && (futureFundId || savingsGoalId)) ? (
          <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            This reduces the reserve balance instead of this month&apos;s budget — the money was
            already set aside when you contributed it.
          </p>
        ) : null}

        {/* Notes ----------------------------------------------------------- */}
        <Field label="Notes" htmlFor="notes" error={errors.notes?.message}>
          <Textarea id="notes" placeholder="Anything worth remembering…" {...form.register("notes")} />
        </Field>
      </DialogBody>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={form.formState.isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={form.formState.isSubmitting}>
          {isEditing ? "Save changes" : `Add ${amountValue > 0 ? money.format(amountValue) : "transaction"}`}
        </Button>
      </DialogFooter>
    </form>
  );
}
