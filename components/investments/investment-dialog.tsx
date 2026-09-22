"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import type { z } from "zod";

import { useMoney } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createInvestment, updateInvestment } from "@/lib/actions/investments";
import { runAction } from "@/lib/client/run-action";
import { INVESTMENT_KIND_LABELS } from "@/lib/labels";
import type { InvestmentDTO, InvestmentKind } from "@/lib/types";
import { investmentInputSchema } from "@/lib/validations/planning";

type InvestmentFormValues = z.input<typeof investmentInputSchema>;

/**
 * Builds the form's starting values.
 *
 * @param investment - The investment being edited, or null when creating.
 * @returns Form values matching the schema's input shape.
 */
function toDefaults(investment: InvestmentDTO | null): InvestmentFormValues {
  return {
    name: investment?.name ?? "",
    kind: investment?.kind ?? "SIP",
    provider: investment?.provider ?? "",
    monthlyContribution: investment?.monthlyContribution ?? 0,
    openingBalance: investment?.openingBalance ?? 0,
    notes: investment?.notes ?? undefined,
    color: investment?.color ?? "#4a3aa7",
  };
}

/**
 * Create/edit dialog for an investment.
 *
 * @param props - The investment being edited (null to create) and open state.
 * @returns The dialog.
 */
export function InvestmentDialog({
  investment,
  open,
  onOpenChange,
}: {
  investment: InvestmentDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const money = useMoney();
  const isEditing = investment !== null;

  const form = useForm<InvestmentFormValues, unknown, z.output<typeof investmentInputSchema>>({
    resolver: zodResolver(investmentInputSchema),
    defaultValues: toDefaults(investment),
  });

  React.useEffect(() => {
    if (open) form.reset(toDefaults(investment));
  }, [form, investment, open]);

  const onSubmit = form.handleSubmit(async (values) => {
    const saved = await runAction(
      () =>
        isEditing
          ? updateInvestment({ id: investment.id, data: values })
          : createInvestment(values),
      { success: isEditing ? "Investment updated" : `${values.name} added` },
    );

    if (saved) onOpenChange(false);
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit investment" : "New investment"}</DialogTitle>
          <DialogDescription>
            Record what you put in. This is a contribution tracker, not a market-price tracker.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="inv-name" required error={errors.name?.message}>
                <Input id="inv-name" placeholder="SIP" autoFocus {...form.register("name")} />
              </Field>

              <Field label="Type" htmlFor="inv-kind">
                <Select
                  value={form.watch("kind") ?? "SIP"}
                  onValueChange={(value) => form.setValue("kind", value as InvestmentKind)}
                >
                  <SelectTrigger id="inv-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INVESTMENT_KIND_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Provider or account" htmlFor="inv-provider" error={errors.provider?.message}>
              <Input
                id="inv-provider"
                placeholder="Fund house, broker, bank…"
                {...form.register("provider")}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={`Monthly plan (${money.currency})`}
                htmlFor="inv-monthly"
                error={errors.monthlyContribution?.message}
              >
                <Input
                  id="inv-monthly"
                  inputMode="decimal"
                  className="tabular"
                  {...form.register("monthlyContribution")}
                />
              </Field>

              <Field
                label={`Already invested (${money.currency})`}
                htmlFor="inv-opening"
                hint="Total put in before tracking started"
                error={errors.openingBalance?.message}
              >
                <Input
                  id="inv-opening"
                  inputMode="decimal"
                  className="tabular"
                  {...form.register("openingBalance")}
                />
              </Field>
            </div>

            <Field label="Colour" htmlFor="inv-color">
              <ColorPicker
                value={form.watch("color") ?? "#4a3aa7"}
                onChange={(next) => form.setValue("color", next, { shouldDirty: true })}
              />
            </Field>

            <Field label="Notes" htmlFor="inv-notes" error={errors.notes?.message}>
              <Textarea
                id="inv-notes"
                placeholder="Anything worth remembering…"
                {...form.register("notes")}
              />
            </Field>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              {isEditing ? "Save changes" : "Add investment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Button that opens the create-investment dialog.
 *
 * @param props - Button size.
 * @returns The button and its dialog.
 */
export function NewInvestmentButton({ size = "sm" }: { size?: "sm" | "default" }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button size={size} onClick={() => setOpen(true)}>
        <Plus /> New investment
      </Button>
      <InvestmentDialog investment={null} open={open} onOpenChange={setOpen} />
    </>
  );
}
