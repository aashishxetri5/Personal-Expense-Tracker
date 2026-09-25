"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { TransactionForm } from "@/components/transactions/transaction-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FormOptions } from "@/lib/db/queries/reference";
import { currentMonth, isSameMonth, parseMonthKey, toDateKey, today } from "@/lib/month";
import type { TransactionDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

type DialogState = { open: boolean; transaction: TransactionDTO | null };

type TransactionDialogContextValue = {
  add: () => void;
  edit: (transaction: TransactionDTO) => void;
};

const TransactionDialogContext = React.createContext<TransactionDialogContextValue | null>(null);

/** Open the Add/Edit transaction dialog from anywhere in the app. */
export function useTransactionDialog(): TransactionDialogContextValue {
  const context = React.useContext(TransactionDialogContext);
  if (!context) {
    throw new Error("useTransactionDialog must be used inside <TransactionDialogProvider>");
  }
  return context;
}

export function TransactionDialogProvider({
  options,
  children,
}: {
  options: FormOptions;
  children: React.ReactNode;
}) {
  const [state, setState] = React.useState<DialogState>({ open: false, transaction: null });
  const searchParams = useSearchParams();

  /**
   * When you are browsing an earlier month, a new transaction should land in
   * that month rather than today — otherwise adding to August silently files
   * the entry under the current month.
   */
  const selectedMonth = parseMonthKey(searchParams.get("m"));
  const defaultDate = isSameMonth(selectedMonth, currentMonth())
    ? toDateKey(today())
    : toDateKey(selectedMonth);

  const value = React.useMemo<TransactionDialogContextValue>(
    () => ({
      add: () => setState({ open: true, transaction: null }),
      edit: (transaction) => setState({ open: true, transaction }),
    }),
    [],
  );

  const close = React.useCallback(() => setState((prev) => ({ ...prev, open: false })), []);

  return (
    <TransactionDialogContext.Provider value={value}>
      {children}

      <Dialog
        open={state.open}
        onOpenChange={(open) => setState((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {state.transaction ? "Edit transaction" : "Add transaction"}
            </DialogTitle>
            <DialogDescription>
              {state.transaction
                ? "Changes apply to the month the transaction is dated in."
                : "Income, spending, investments and transfers are counted separately."}
            </DialogDescription>
          </DialogHeader>

          {/* Remounting on open resets the form cleanly between uses. */}
          {state.open ? (
            <TransactionForm
              key={state.transaction?.id ?? "new"}
              options={options}
              transaction={state.transaction}
              defaultDate={defaultDate}
              onDone={close}
              onCancel={close}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </TransactionDialogContext.Provider>
  );
}

/** Primary call-to-action, used in the top bar and empty states. */
export function AddTransactionButton({
  className,
  size = "default",
  variant = "gold",
  label = "Add transaction",
}: {
  className?: string;
  size?: "default" | "sm" | "lg";
  variant?: "gold" | "default" | "outline" | "secondary";
  label?: string;
}) {
  const { add } = useTransactionDialog();

  return (
    <Button onClick={add} size={size} variant={variant} className={className}>
      <Plus />
      {label}
    </Button>
  );
}

/** Thumb-reachable floating button, phones only — a brass coin above the dock. */
export function AddTransactionFab({ className }: { className?: string }) {
  const { add } = useTransactionDialog();

  return (
    <button
      type="button"
      onClick={add}
      aria-label="Add transaction"
      className={cn(
        "fixed right-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center rounded-full bg-gold sheen text-gold-foreground ring-4 ring-gold/20 shadow-[inset_0_1px_0_oklch(1_0_0/0.5),0_14px_28px_-8px_oklch(0.45_0.12_70/0.6)] transition-transform active:scale-95 lg:hidden",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        className,
      )}
    >
      <span aria-hidden className="absolute inset-1 rounded-full border border-dashed border-gold-deep/40" />
      <Plus className="relative size-6" />
    </button>
  );
}
