"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/display";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/primitives";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { archiveAccount, createAccount, updateAccount } from "@/lib/actions/planning";
import type { AccountDTO, AccountKind } from "@/lib/types";
import { accountInputSchema } from "@/lib/validations/planning";
import { cn } from "@/lib/utils";

const KIND_LABELS: Record<AccountKind, string> = {
  CASH: "Cash",
  BANK: "Bank",
  WALLET: "Wallet",
  CARD: "Card",
  OTHER: "Other",
};

type AccountFormValues = z.input<typeof accountInputSchema>;

function toDefaults(account: AccountDTO | null): AccountFormValues {
  return {
    name: account?.name ?? "",
    kind: account?.kind ?? "WALLET",
    openingBalance: account?.openingBalance ?? 0,
  };
}

function AccountDialog({
  account,
  open,
  onOpenChange,
}: {
  account: AccountDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEditing = account !== null;
  const form = useForm<AccountFormValues, unknown, z.output<typeof accountInputSchema>>({
    resolver: zodResolver(accountInputSchema),
    defaultValues: toDefaults(account),
  });

  React.useEffect(() => {
    if (open) form.reset(toDefaults(account));
  }, [account, form, open]);

  const onSubmit = form.handleSubmit(async (values) => {
    const result = isEditing
      ? await updateAccount({ id: account.id, data: values })
      : await createAccount(values);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(isEditing ? "Payment method updated" : `${values.name} added`);
    onOpenChange(false);
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit payment method" : "New payment method"}</DialogTitle>
          <DialogDescription>
            Cash, a bank account, eSewa, Khalti, a card — whatever you actually pay with.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="space-y-4">
            <Field label="Name" htmlFor="acc-name" required error={errors.name?.message}>
              <Input id="acc-name" autoFocus placeholder="eSewa" {...form.register("name")} />
            </Field>

            <Field label="Kind" htmlFor="acc-kind">
              <Select
                value={form.watch("kind") ?? "WALLET"}
                onValueChange={(value) => form.setValue("kind", value as AccountKind)}
              >
                <SelectTrigger id="acc-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(KIND_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Opening balance"
              htmlFor="acc-opening"
              hint="Optional. Useful later when per-account balances are shown."
              error={errors.openingBalance?.message}
            >
              <Input
                id="acc-opening"
                inputMode="decimal"
                className="tabular"
                {...form.register("openingBalance")}
              />
            </Field>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              {isEditing ? "Save changes" : "Add method"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AccountManager({ accounts }: { accounts: AccountDTO[] }) {
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<AccountDTO | null>(null);

  const toggleArchive = async (account: AccountDTO) => {
    const result = await archiveAccount({ id: account.id, archived: !account.archived });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(account.archived ? `${account.name} restored` : `${account.name} archived`);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>Payment methods</CardTitle>
          <CardDescription>Where money comes from when you record a transaction.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus /> Add
        </Button>
      </CardHeader>

      <CardContent>
        <ul>
          {accounts.map((account) => (
            <li
              key={account.id}
              className={cn(
                "flex items-center gap-3 border-b border-border py-2.5 last:border-0",
                account.archived && "opacity-55",
              )}
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{account.name}</span>
              {account.openingBalance !== 0 ? (
                <span className="text-xs text-muted-foreground">
                  opening <Money value={account.openingBalance} />
                </span>
              ) : null}
              {account.archived ? <Badge variant="outline">Archived</Badge> : null}
              <Badge>{KIND_LABELS[account.kind]}</Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${account.name}`}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => setEditing(account)}>
                    <Pencil /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => toggleArchive(account)}>
                    {account.archived ? (
                      <>
                        <ArchiveRestore /> Restore
                      </>
                    ) : (
                      <>
                        <Archive /> Archive
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      </CardContent>

      <AccountDialog account={null} open={creating} onOpenChange={setCreating} />
      <AccountDialog
        account={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </Card>
  );
}
