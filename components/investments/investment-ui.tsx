"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Plus, TrendingUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { useChartTheme } from "@/components/charts/chart-kit";
import { Money } from "@/components/money";
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
import { Badge, ColorDot, EmptyState } from "@/components/ui/display";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import {
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/primitives";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  archiveInvestment,
  createInvestment,
  deleteInvestment,
  updateInvestment,
} from "@/lib/actions/planning";
import type { InvestmentDTO, InvestmentKind, InvestmentWithTotals } from "@/lib/types";
import { investmentInputSchema } from "@/lib/validations/planning";

const KIND_LABELS: Record<InvestmentKind, string> = {
  SIP: "SIP",
  MUTUAL_FUND: "Mutual fund",
  STOCKS: "Stocks",
  FIXED_DEPOSIT: "Fixed deposit",
  GOLD: "Gold",
  RETIREMENT: "Retirement",
  OTHER: "Other",
};

type InvestmentFormValues = z.input<typeof investmentInputSchema>;

function toDefaults(investment: InvestmentDTO | null): InvestmentFormValues {
  if (!investment) {
    return {
      name: "",
      kind: "SIP",
      provider: "",
      monthlyContribution: 0,
      openingBalance: 0,
      notes: undefined,
      color: "#4a3aa7",
    };
  }

  return {
    name: investment.name,
    kind: investment.kind,
    provider: investment.provider ?? "",
    monthlyContribution: investment.monthlyContribution,
    openingBalance: investment.openingBalance,
    notes: investment.notes ?? undefined,
    color: investment.color,
  };
}

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
    const result = isEditing
      ? await updateInvestment({ id: investment.id, data: values })
      : await createInvestment(values);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Investment updated" : `${values.name} added`);
    onOpenChange(false);
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
                    {Object.entries(KIND_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Provider or account" htmlFor="inv-provider" error={errors.provider?.message}>
              <Input id="inv-provider" placeholder="Fund house, broker, bank…" {...form.register("provider")} />
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
              <Textarea id="inv-notes" placeholder="Anything worth remembering…" {...form.register("notes")} />
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

function InvestmentActions({ investment }: { investment: InvestmentWithTotals }) {
  const [editing, setEditing] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const toggleArchive = async () => {
    const result = await archiveInvestment({ id: investment.id, archived: !investment.archived });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(investment.archived ? `${investment.name} restored` : `${investment.name} archived`);
  };

  const handleDelete = async () => {
    setPending(true);
    const result = await deleteInvestment({ id: investment.id });
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setConfirming(false);
    toast.success(
      result.data.archived
        ? `${investment.name} has contributions, so it was archived instead`
        : `${investment.name} deleted`,
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${investment.name}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={toggleArchive}>
            {investment.archived ? (
              <>
                <ArchiveRestore /> Restore
              </>
            ) : (
              <>
                <Archive /> Archive
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <InvestmentDialog investment={investment} open={editing} onOpenChange={setEditing} />

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        loading={pending}
        title={`Delete ${investment.name}?`}
        description="Investments with contributions are archived instead, so your history stays intact."
        onConfirm={handleDelete}
      />
    </>
  );
}

export function InvestmentGrid({ investments }: { investments: InvestmentWithTotals[] }) {
  const theme = useChartTheme();

  if (investments.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No investments yet"
        description="Add your SIP or any other plan you pay into, then record contributions as investment transactions."
        action={<NewInvestmentButton size="default" />}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {investments.map((investment) => (
        <article
          key={investment.id}
          className="rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm"
        >
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ColorDot color={theme.series(investment.color)} />
                <span className="truncate">{investment.name}</span>
              </h3>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{KIND_LABELS[investment.kind]}</Badge>
                {investment.provider ? <span className="truncate">{investment.provider}</span> : null}
              </p>
            </div>
            <InvestmentActions investment={investment} />
          </header>

          <p className="mt-4 text-2xl font-semibold tracking-tight">
            <Money value={investment.totalInvested} />
          </p>
          <p className="text-xs text-muted-foreground">total invested</p>

          <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-xs">
            <div>
              <dt className="text-muted-foreground">This month</dt>
              <dd className="mt-0.5 font-medium">
                <Money value={investment.investedThisMonth} />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">This year</dt>
              <dd className="mt-0.5 font-medium">
                <Money value={investment.investedThisYear} />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Monthly plan</dt>
              <dd className="mt-0.5 font-medium">
                <Money value={investment.monthlyContribution} />
              </dd>
            </div>
          </dl>

          {investment.notes ? (
            <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
              {investment.notes}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
