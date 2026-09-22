"use client";

import * as React from "react";
import { ArrowLeftRight, MoreHorizontal, Pencil, Receipt, Trash2 } from "lucide-react";

import { useChartTheme } from "@/components/charts/chart-kit";
import { Money } from "@/components/money";
import { AddTransactionButton, useTransactionDialog } from "@/components/transactions/transaction-dialog";
import { Badge } from "@/components/ui/badge";
import { ColorDot } from "@/components/ui/color-dot";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteTransaction } from "@/lib/actions/transactions";
import { runAction } from "@/lib/client/run-action";
import { formatDateLong, formatDayShort, parseDateKey } from "@/lib/month";
import type { TransactionDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

/** How a transaction reads in a list: direction, colour and sign. */
function presentation(transaction: TransactionDTO) {
  switch (transaction.type) {
    case "INCOME":
      return { sign: 1, className: "text-[var(--success)]", label: "Income" };
    case "EXPENSE":
      return { sign: -1, className: "text-foreground", label: "Expense" };
    case "INVESTMENT":
      return { sign: -1, className: "text-primary", label: "Investment" };
    case "TRANSFER":
    default:
      return { sign: 0, className: "text-muted-foreground", label: "Transfer" };
  }
}

function TransactionMeta({ transaction }: { transaction: TransactionDTO }) {
  const theme = useChartTheme();

  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      {transaction.category ? (
        <span className="flex items-center gap-1.5">
          <ColorDot color={theme.series(transaction.category.color)} className="size-2" />
          {transaction.category.name}
        </span>
      ) : (
        <span>Uncategorised</span>
      )}
      {transaction.account ? <span>· {transaction.account.name}</span> : null}
      {transaction.futureFund ? (
        <Badge variant="outline">
          {transaction.type === "EXPENSE" ? "From" : "To"} {transaction.futureFund.name}
        </Badge>
      ) : null}
      {transaction.savingsGoal ? (
        <Badge variant="outline">
          {transaction.type === "EXPENSE" ? "From" : "To"} {transaction.savingsGoal.name}
        </Badge>
      ) : null}
      {transaction.transferAccount ? (
        <Badge variant="outline">
          <ArrowLeftRight className="size-2.5" /> {transaction.transferAccount.name}
        </Badge>
      ) : null}
      {transaction.isDemo ? <Badge variant="primary">Demo</Badge> : null}
    </span>
  );
}

function RowActions({ transaction }: { transaction: TransactionDTO }) {
  const { edit } = useTransactionDialog();
  const [confirming, setConfirming] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const handleDelete = async () => {
    setPending(true);
    const deleted = await runAction(() => deleteTransaction({ id: transaction.id }), {
      success: "Transaction deleted",
    });
    setPending(false);

    if (deleted) setConfirming(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${transaction.description || "transaction"}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => edit(transaction)}>
            <Pencil /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        loading={pending}
        title="Delete this transaction?"
        description={
          <>
            {transaction.description || "This transaction"} on{" "}
            {formatDateLong(parseDateKey(transaction.date) ?? new Date())} will be removed. Balances
            and totals will update everywhere.
          </>
        }
        onConfirm={handleDelete}
      />
    </>
  );
}

function AmountCell({ transaction }: { transaction: TransactionDTO }) {
  const { sign, className } = presentation(transaction);

  return (
    <span className={cn("font-medium tabular", className)}>
      {sign === 0 ? (
        <Money value={transaction.amount} />
      ) : (
        <Money value={sign * transaction.amount} signed />
      )}
    </span>
  );
}

export function TransactionList({
  transactions,
  emptyTitle = "No transactions yet",
  emptyDescription,
}: {
  transactions: TransactionDTO[];
  emptyTitle?: string;
  emptyDescription?: React.ReactNode;
}) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title={emptyTitle}
        description={emptyDescription}
        action={<AddTransactionButton size="sm" />}
      />
    );
  }

  return (
    <>
      {/* Mobile: one tappable card per transaction. */}
      <ul className="divide-y divide-border md:hidden">
        {transactions.map((transaction) => (
          <li key={transaction.id} className="flex items-start gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {transaction.description || transaction.category?.name || "Transaction"}
              </p>
              <TransactionMeta transaction={transaction} />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <AmountCell transaction={transaction} />
              <span className="text-xs text-muted-foreground tabular">
                {formatDayShort(parseDateKey(transaction.date) ?? new Date())}
              </span>
            </div>
            <RowActions transaction={transaction} />
          </li>
        ))}
      </ul>

      {/* Desktop: a dense but airy table. */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-48">Category</TableHead>
              <TableHead className="w-32 text-right">Amount</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const date = parseDateKey(transaction.date) ?? new Date();
              return (
                <TableRow key={transaction.id}>
                  <TableCell className="text-muted-foreground tabular">
                    <time dateTime={transaction.date} title={formatDateLong(date)}>
                      {formatDayShort(date)}
                    </time>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {transaction.description || transaction.category?.name || "Transaction"}
                    </p>
                    {transaction.notes ? (
                      <p className="truncate text-xs text-muted-foreground">{transaction.notes}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <TransactionMeta transaction={transaction} />
                  </TableCell>
                  <TableCell className="text-right">
                    <AmountCell transaction={transaction} />
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions transaction={transaction} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
