"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { useMoney } from "@/components/providers";
import { ColorPicker } from "@/components/ui/color-picker";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSavingsGoal, updateSavingsGoal } from "@/lib/actions/planning";
import type { SavingsGoalDTO } from "@/lib/types";
import { savingsGoalInputSchema } from "@/lib/validations/planning";

type GoalFormValues = z.input<typeof savingsGoalInputSchema>;

function toDefaults(goal: SavingsGoalDTO | null): GoalFormValues {
  if (!goal) {
    return {
      name: "",
      kind: "GENERAL",
      targetAmount: 0,
      openingBalance: 0,
      monthlyContribution: 0,
      targetDate: "",
      notes: undefined,
      color: "#1baf7a",
      icon: "Target",
    };
  }

  return {
    name: goal.name,
    kind: goal.kind,
    targetAmount: goal.targetAmount,
    openingBalance: goal.openingBalance,
    monthlyContribution: goal.monthlyContribution,
    targetDate: goal.targetDate ?? "",
    notes: goal.notes ?? undefined,
    color: goal.color,
    icon: goal.icon,
  };
}

export function GoalDialog({
  goal,
  open,
  onOpenChange,
}: {
  goal: SavingsGoalDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const money = useMoney();
  const isEditing = goal !== null;

  const form = useForm<GoalFormValues, unknown, z.output<typeof savingsGoalInputSchema>>({
    resolver: zodResolver(savingsGoalInputSchema),
    defaultValues: toDefaults(goal),
  });

  React.useEffect(() => {
    if (open) form.reset(toDefaults(goal));
  }, [form, goal, open]);

  const onSubmit = form.handleSubmit(async (values) => {
    const result = isEditing
      ? await updateSavingsGoal({ id: goal.id, data: values })
      : await createSavingsGoal(values);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Goal updated" : `${values.name} created`);
    onOpenChange(false);
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit goal" : "New savings goal"}</DialogTitle>
          <DialogDescription>
            Track what you are saving towards. Money moved into a goal counts as saved, not spent.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="goal-name" required error={errors.name?.message}>
                <Input id="goal-name" placeholder="Laptop" autoFocus {...form.register("name")} />
              </Field>

              <Field label="Type" htmlFor="goal-kind" hint="Emergency funds are shown separately.">
                <Select
                  value={form.watch("kind") ?? "GENERAL"}
                  onValueChange={(value) => form.setValue("kind", value as "EMERGENCY" | "GENERAL")}
                >
                  <SelectTrigger id="goal-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">Savings goal</SelectItem>
                    <SelectItem value="EMERGENCY">Emergency fund</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={`Target (${money.currency})`}
                htmlFor="goal-target"
                error={errors.targetAmount?.message}
              >
                <Input id="goal-target" inputMode="decimal" className="tabular" {...form.register("targetAmount")} />
              </Field>

              <Field
                label={`Monthly plan (${money.currency})`}
                htmlFor="goal-monthly"
                error={errors.monthlyContribution?.message}
              >
                <Input
                  id="goal-monthly"
                  inputMode="decimal"
                  className="tabular"
                  {...form.register("monthlyContribution")}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={`Already saved (${money.currency})`}
                htmlFor="goal-opening"
                hint="What was in this goal before you started tracking"
                error={errors.openingBalance?.message}
              >
                <Input
                  id="goal-opening"
                  inputMode="decimal"
                  className="tabular"
                  {...form.register("openingBalance")}
                />
              </Field>

              <Field label="Target date" htmlFor="goal-date" error={errors.targetDate?.message}>
                <Input id="goal-date" type="date" {...form.register("targetDate")} />
              </Field>
            </div>

            <Field label="Colour" htmlFor="goal-color">
              <ColorPicker
                value={form.watch("color") ?? "#1baf7a"}
                onChange={(next) => form.setValue("color", next, { shouldDirty: true })}
              />
            </Field>

            <Field label="Notes" htmlFor="goal-notes" error={errors.notes?.message}>
              <Textarea id="goal-notes" placeholder="Why this matters, or what it is for…" {...form.register("notes")} />
            </Field>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              {isEditing ? "Save changes" : "Create goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewGoalButton({ size = "sm" }: { size?: "sm" | "default" }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button size={size} onClick={() => setOpen(true)}>
        <Plus /> New goal
      </Button>
      <GoalDialog goal={null} open={open} onOpenChange={setOpen} />
    </>
  );
}
