"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAccount, updateAccount } from "@/lib/actions/accounts";
import { runAction } from "@/lib/client/run-action";
import { ACCOUNT_KIND_LABELS } from "@/lib/labels";
import type { AccountDTO, AccountKind } from "@/lib/types";
import { accountInputSchema } from "@/lib/validations/planning";

type AccountFormValues = z.input<typeof accountInputSchema>;

/**
 * Builds the form's starting values.
 *
 * @param account - The payment method being edited, or null when creating.
 * @returns Form values matching the schema's input shape.
 */
function toDefaults(account: AccountDTO | null): AccountFormValues {
  return {
    name: account?.name ?? "",
    kind: account?.kind ?? "WALLET",
    openingBalance: account?.openingBalance ?? 0,
  };
}

/**
 * Create/edit dialog for a payment method.
 *
 * @param props - The account being edited (null to create) and open state.
 * @returns The dialog.
 */
export function AccountDialog({
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
    const saved = await runAction(
      () => (isEditing ? updateAccount({ id: account.id, data: values }) : createAccount(values)),
      { success: isEditing ? "Payment method updated" : `${values.name} added` },
    );

    if (saved) onOpenChange(false);
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
                  {Object.entries(ACCOUNT_KIND_LABELS).map(([value, label]) => (
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
