"use client";

import * as React from "react";
import { Copy, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import { useChartTheme } from "@/components/charts/chart-kit";
import { Money } from "@/components/money";
import { useMoney } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, ColorDot } from "@/components/ui/display";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/primitives";
import { copyBudget, saveBudget } from "@/lib/actions/budget";
import type { BudgetLine } from "@/lib/calculations/budget";
import { round2 } from "@/lib/format";
import { addMonths, formatMonthLabel, parseMonthKey, toMonthKey } from "@/lib/month";
import type { CategoryDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_SECTIONS: { kind: CategoryDTO["kind"]; label: string; hint: string }[] = [
  { kind: "EXPENSE", label: "Spending", hint: "What you expect to spend this month" },
  { kind: "FUTURE_FUND", label: "Future funds", hint: "Set aside now for bills that arrive later" },
  { kind: "INVESTMENT", label: "Investments", hint: "Money moved into investments, not spent" },
  { kind: "SAVINGS", label: "Savings", hint: "Money moved into savings goals" },
];

function parseAmount(value: string): number {
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? round2(parsed) : 0;
}

/**
 * The plan for one month.
 *
 * Saving writes a single `MonthlyBudget` row: changing October cannot reach
 * September, because they are different records. That is the whole reason
 * budgets are stored per month rather than as one global set of amounts.
 */
export function BudgetEditor({
  monthKey,
  incomeTarget,
  note,
  categories,
  lines,
  hasBudget,
  defaultMonthlyIncome,
}: {
  monthKey: string;
  incomeTarget: number;
  note: string | null;
  categories: CategoryDTO[];
  lines: BudgetLine[];
  hasBudget: boolean;
  defaultMonthlyIncome: number;
}) {
  const theme = useChartTheme();
  const money = useMoney();
  const month = parseMonthKey(monthKey);
  const previousMonth = addMonths(month, -1);

  const actualByCategory = React.useMemo(
    () => new Map(lines.map((line) => [line.categoryId, line.actual])),
    [lines],
  );
  const plannedByCategory = React.useMemo(
    () => new Map(lines.map((line) => [line.categoryId, line.planned])),
    [lines],
  );

  const buildDraft = React.useCallback(() => {
    const draft: Record<string, string> = {};
    for (const category of categories) {
      const planned = plannedByCategory.get(category.id) ?? 0;
      draft[category.id] = planned > 0 ? String(planned) : "";
    }
    return draft;
  }, [categories, plannedByCategory]);

  const [draft, setDraft] = React.useState<Record<string, string>>(buildDraft);
  const [income, setIncome] = React.useState(
    String(incomeTarget > 0 ? incomeTarget : hasBudget ? 0 : defaultMonthlyIncome),
  );
  const [noteValue, setNoteValue] = React.useState(note ?? "");
  const [saving, setSaving] = React.useState(false);
  const [copying, setCopying] = React.useState(false);
  const [confirmCopy, setConfirmCopy] = React.useState(false);

  // Re-seed the form when the user navigates to a different month.
  React.useEffect(() => {
    setDraft(buildDraft());
    setIncome(String(incomeTarget > 0 ? incomeTarget : hasBudget ? 0 : defaultMonthlyIncome));
    setNoteValue(note ?? "");
  }, [buildDraft, defaultMonthlyIncome, hasBudget, incomeTarget, note]);

  const plannedTotal = React.useMemo(
    () => round2(Object.values(draft).reduce((sum, value) => sum + parseAmount(value), 0)),
    [draft],
  );
  const incomeValue = parseAmount(income);
  const unallocated = round2(incomeValue - plannedTotal);

  const dirty = React.useMemo(() => {
    if (String(incomeTarget) !== String(incomeValue)) return true;
    if ((note ?? "") !== noteValue) return true;
    return categories.some(
      (category) => (plannedByCategory.get(category.id) ?? 0) !== parseAmount(draft[category.id] ?? ""),
    );
  }, [categories, draft, income, incomeTarget, incomeValue, note, noteValue, plannedByCategory]);

  const handleSave = async () => {
    setSaving(true);
    const result = await saveBudget({
      month: monthKey,
      incomeTarget: incomeValue,
      note: noteValue,
      items: categories
        .map((category) => ({ categoryId: category.id, plannedAmount: parseAmount(draft[category.id] ?? "") }))
        .filter((item) => item.plannedAmount > 0),
    });
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${formatMonthLabel(month)} budget saved`, {
      description: `${money.format(plannedTotal)} planned across ${
        categories.filter((c) => parseAmount(draft[c.id] ?? "") > 0).length
      } categories`,
    });
  };

  const handleCopy = async () => {
    setCopying(true);
    const result = await copyBudget({ from: toMonthKey(previousMonth), to: monthKey });
    setCopying(false);
    setConfirmCopy(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Copied ${formatMonthLabel(previousMonth)} into ${formatMonthLabel(month)}`);
  };

  const sections = KIND_SECTIONS.map((section) => ({
    ...section,
    items: categories.filter((category) => category.kind === section.kind && !category.archived),
  })).filter((section) => section.items.length > 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Expected income</CardTitle>
          <CardDescription>
            What you plan to receive in {formatMonthLabel(month)}. Actual income is recorded as
            transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Income target" htmlFor="incomeTarget">
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                {money.currency}
              </span>
              <Input
                id="incomeTarget"
                inputMode="decimal"
                value={income}
                onChange={(event) => setIncome(event.target.value)}
                className="pl-12 font-medium tabular"
              />
            </div>
          </Field>

          <Field label="Note" htmlFor="budgetNote" hint="Optional — why this month is different.">
            <Input
              id="budgetNote"
              value={noteValue}
              onChange={(event) => setNoteValue(event.target.value)}
              placeholder="Dashain month, extra travel…"
            />
          </Field>
        </CardContent>
      </Card>

      {sections.map((section) => (
        <Card key={section.kind}>
          <CardHeader>
            <CardTitle>{section.label}</CardTitle>
            <CardDescription>{section.hint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {section.items.map((category) => {
              const actual = actualByCategory.get(category.id) ?? 0;
              const planned = parseAmount(draft[category.id] ?? "");
              const over = planned > 0 && actual > planned;

              return (
                <div
                  key={category.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-muted/40"
                >
                  <label
                    htmlFor={`plan-${category.id}`}
                    className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium"
                  >
                    <ColorDot color={theme.series(category.color)} />
                    <span className="truncate">{category.name}</span>
                    {category.carryForward ? (
                      <Badge variant="outline" className="shrink-0">
                        Rolls over
                      </Badge>
                    ) : null}
                  </label>

                  <span
                    className={cn(
                      "shrink-0 text-xs tabular",
                      over ? "font-medium text-destructive" : "text-muted-foreground",
                    )}
                  >
                    <Money value={actual} /> spent
                  </span>

                  <div className="relative w-32 shrink-0">
                    <Input
                      id={`plan-${category.id}`}
                      inputMode="decimal"
                      value={draft[category.id] ?? ""}
                      placeholder="0"
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, [category.id]: event.target.value }))
                      }
                      className="h-8 text-right tabular"
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Sticky save bar — the totals stay visible while you edit. */}
      <div className="sticky bottom-20 z-20 rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur lg:bottom-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div>
              <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Planned
              </dt>
              <dd className="font-semibold tabular">
                <Money value={plannedTotal} />
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Income
              </dt>
              <dd className="font-semibold tabular">
                <Money value={incomeValue} />
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Unallocated
              </dt>
              <dd className="font-semibold tabular">
                <Money value={unallocated} tone={unallocated < 0 ? "negative" : "none"} />
              </dd>
            </div>
          </dl>

          <div className="flex items-center gap-2">
            {dirty ? (
              <Button variant="ghost" size="sm" onClick={() => setDraft(buildDraft())}>
                <RotateCcw /> Reset
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => setConfirmCopy(true)} loading={copying}>
              <Copy /> Copy {formatMonthLabel(previousMonth)}
            </Button>
            <Button size="sm" onClick={handleSave} loading={saving} disabled={!dirty && hasBudget}>
              <Save /> Save budget
            </Button>
          </div>
        </div>

        {unallocated < 0 ? (
          <p className="mt-3 border-t border-border pt-3 text-xs text-destructive">
            You have planned <Money value={-unallocated} /> more than you expect to receive.
          </p>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmCopy}
        onOpenChange={setConfirmCopy}
        destructive={false}
        loading={copying}
        confirmLabel="Copy plan"
        title={`Copy ${formatMonthLabel(previousMonth)} into ${formatMonthLabel(month)}?`}
        description={
          <>
            This replaces the plan for {formatMonthLabel(month)} only.{" "}
            {formatMonthLabel(previousMonth)} is not changed, and neither is any other month.
          </>
        }
        onConfirm={handleCopy}
      />
    </div>
  );
}
