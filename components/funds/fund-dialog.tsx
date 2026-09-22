"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import type { z } from "zod";

import { useMoney } from "@/components/providers";
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
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/field";
import { createFutureFund, updateFutureFund } from "@/lib/actions/funds";
import { runAction } from "@/lib/client/run-action";
import { futureFundInputSchema } from "@/lib/validations/planning";
import type { FutureFundDTO } from "@/lib/types";
import { ColorPicker } from "@/components/ui/color-picker";

type FundFormValues = z.input<typeof futureFundInputSchema>;

function toDefaults(fund: FutureFundDTO | null): FundFormValues {
  if (!fund) {
    return {
      name: "",
      description: undefined,
      targetAmount: 0,
      monthlyContribution: 0,
      openingBalance: 0,
      nextExpenseLabel: "",
      nextDueDate: "",
      color: "#2a78d6",
      icon: "PiggyBank",
      createCategory: true,
    };
  }

  return {
    name: fund.name,
    description: fund.description ?? undefined,
    targetAmount: fund.targetAmount,
    monthlyContribution: fund.monthlyContribution,
    openingBalance: fund.openingBalance,
    nextExpenseLabel: fund.nextExpenseLabel ?? "",
    nextDueDate: fund.nextDueDate ?? "",
    color: fund.color,
    icon: fund.icon,
    createCategory: fund.categoryId !== null,
  };
}

export function FundDialog({
  fund,
  open,
  onOpenChange,
}: {
  fund: FutureFundDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const money = useMoney();
  const isEditing = fund !== null;

  const form = useForm<FundFormValues, unknown, z.output<typeof futureFundInputSchema>>({
    resolver: zodResolver(futureFundInputSchema),
    defaultValues: toDefaults(fund),
  });

  React.useEffect(() => {
    if (open) form.reset(toDefaults(fund));
  }, [fund, form, open]);

  const onSubmit = form.handleSubmit(async (values) => {
    const saved = await runAction(
      () => (isEditing ? updateFutureFund({ id: fund.id, data: values }) : createFutureFund(values)),
      { success: isEditing ? "Fund updated" : `${values.name} fund created` },
    );

    if (saved) onOpenChange(false);
  });

  const errors = form.formState.errors;
  const color = form.watch("color") ?? "#2a78d6";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit fund" : "New future fund"}</DialogTitle>
          <DialogDescription>
            Reserve a little each month for costs that arrive occasionally — servicing, dental work,
            festivals, replacements.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="space-y-4">
            <Field label="Name" htmlFor="fund-name" required error={errors.name?.message}>
              <Input id="fund-name" placeholder="Vehicle" autoFocus {...form.register("name")} />
            </Field>

            <Field label="What it covers" htmlFor="fund-description" error={errors.description?.message}>
              <Textarea
                id="fund-description"
                placeholder="Servicing, tax, tyres, oil and repairs"
                {...form.register("description")}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={`Target (${money.currency})`}
                htmlFor="fund-target"
                hint="Estimated yearly cost"
                error={errors.targetAmount?.message}
              >
                <Input id="fund-target" inputMode="decimal" className="tabular" {...form.register("targetAmount")} />
              </Field>

              <Field
                label={`Monthly plan (${money.currency})`}
                htmlFor="fund-monthly"
                error={errors.monthlyContribution?.message}
              >
                <Input
                  id="fund-monthly"
                  inputMode="decimal"
                  className="tabular"
                  {...form.register("monthlyContribution")}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={`Starting balance (${money.currency})`}
                htmlFor="fund-opening"
                hint="Money already set aside before tracking"
                error={errors.openingBalance?.message}
              >
                <Input
                  id="fund-opening"
                  inputMode="decimal"
                  className="tabular"
                  {...form.register("openingBalance")}
                />
              </Field>

              <Field label="Colour" htmlFor="fund-color">
                <ColorPicker
                  value={color}
                  onChange={(next) => form.setValue("color", next, { shouldDirty: true })}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Next expected expense"
                htmlFor="fund-next"
                error={errors.nextExpenseLabel?.message}
              >
                <Input id="fund-next" placeholder="Servicing" {...form.register("nextExpenseLabel")} />
              </Field>

              <Field label="Next due date" htmlFor="fund-due" error={errors.nextDueDate?.message}>
                <Input id="fund-due" type="date" {...form.register("nextDueDate")} />
              </Field>
            </div>

            {!isEditing ? (
              <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/40 px-3 py-3">
                <div className="space-y-0.5">
                  <Label htmlFor="fund-category">Add a matching budget line</Label>
                  <p className="text-xs text-muted-foreground">
                    Lets you plan the monthly contribution on the Budget page.
                  </p>
                </div>
                <Switch
                  id="fund-category"
                  checked={form.watch("createCategory") ?? true}
                  onCheckedChange={(checked) => form.setValue("createCategory", checked)}
                />
              </div>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              {isEditing ? "Save changes" : "Create fund"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewFundButton({ size = "sm" }: { size?: "sm" | "default" }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button size={size} onClick={() => setOpen(true)}>
        <Plus /> New fund
      </Button>
      <FundDialog fund={null} open={open} onOpenChange={setOpen} />
    </>
  );
}
