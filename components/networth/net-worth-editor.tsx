"use client";

import * as React from "react";
import { Plus, Save, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Money } from "@/components/money";
import { useMoney } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteNetWorthSnapshot, saveNetWorthSnapshot } from "@/lib/actions/net-worth";
import { parseAmountInput, round2 } from "@/lib/format";
import { formatMonthLabel, parseMonthKey } from "@/lib/month";
import type { NetWorthEntryKind, NetWorthSnapshotDTO } from "@/lib/types";
import { localId } from "@/lib/utils";

type DraftEntry = { key: string; label: string; kind: NetWorthEntryKind; amount: string };

const STARTER_ASSETS = ["Cash", "Bank", "Emergency fund", "Investments"];
const STARTER_LIABILITIES = ["Loan", "Credit card"];

function toDraft(snapshot: NetWorthSnapshotDTO | null, suggested: Record<string, number>): DraftEntry[] {
  if (snapshot && snapshot.entries.length > 0) {
    return snapshot.entries.map((entry) => ({
      key: entry.id,
      label: entry.label,
      kind: entry.kind,
      amount: String(entry.amount),
    }));
  }

  return [
    ...STARTER_ASSETS.map((label) => ({
      key: localId(),
      label,
      kind: "ASSET" as const,
      amount: suggested[label] ? String(suggested[label]) : "",
    })),
    ...STARTER_LIABILITIES.map((label) => ({
      key: localId(),
      label,
      kind: "LIABILITY" as const,
      amount: "",
    })),
  ];
}

/**
 * One snapshot per month. Snapshots are point-in-time records rather than a
 * running figure, which is what makes the net-worth line an honest history.
 */
export function NetWorthEditor({
  monthKey,
  snapshot,
  suggested,
}: {
  monthKey: string;
  snapshot: NetWorthSnapshotDTO | null;
  /** Balances the app already knows about, offered as a starting point. */
  suggested: Record<string, number>;
}) {
  const money = useMoney();
  const month = parseMonthKey(monthKey);

  const [entries, setEntries] = React.useState<DraftEntry[]>(() => toDraft(snapshot, suggested));
  const [note, setNote] = React.useState(snapshot?.note ?? "");
  const [saving, setSaving] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    setEntries(toDraft(snapshot, suggested));
    setNote(snapshot?.note ?? "");
  }, [snapshot, suggested]);

  const assets = entries.filter((entry) => entry.kind === "ASSET");
  const liabilities = entries.filter((entry) => entry.kind === "LIABILITY");

  const assetTotal = round2(assets.reduce((sum, entry) => sum + parseAmountInput(entry.amount, { allowNegative: true }), 0));
  const liabilityTotal = round2(liabilities.reduce((sum, entry) => sum + parseAmountInput(entry.amount, { allowNegative: true }), 0));
  const netWorth = round2(assetTotal - liabilityTotal);

  const update = (key: string, patch: Partial<DraftEntry>) =>
    setEntries((prev) => prev.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)));

  const addRow = (kind: NetWorthEntryKind) =>
    setEntries((prev) => [...prev, { key: localId(), label: "", kind, amount: "" }]);

  const removeRow = (key: string) => setEntries((prev) => prev.filter((entry) => entry.key !== key));

  const handleSave = async () => {
    const payload = entries
      .filter((entry) => entry.label.trim().length > 0)
      .map((entry) => ({
        label: entry.label.trim(),
        kind: entry.kind,
        amount: parseAmountInput(entry.amount, { allowNegative: true }),
      }));

    if (payload.length === 0) {
      toast.error("Add at least one asset or liability with a name.");
      return;
    }

    setSaving(true);
    const result = await saveNetWorthSnapshot({ month: monthKey, note, entries: payload });
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${formatMonthLabel(month)} snapshot saved`, {
      description: `Net worth ${money.format(netWorth)}`,
    });
  };

  const handleDelete = async () => {
    const result = await deleteNetWorthSnapshot({ month: monthKey });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setConfirmDelete(false);
    toast.success(`${formatMonthLabel(month)} snapshot removed`);
  };

  const renderGroup = (kind: NetWorthEntryKind, rows: DraftEntry[]) => (
    <div className="space-y-1">
      {rows.map((entry) => (
        <div key={entry.key} className="flex items-center gap-2">
          <Input
            value={entry.label}
            onChange={(event) => update(entry.key, { label: event.target.value })}
            placeholder={kind === "ASSET" ? "Bank" : "Loan"}
            aria-label={`${kind === "ASSET" ? "Asset" : "Liability"} name`}
            className="h-8 flex-1"
          />
          <Input
            value={entry.amount}
            inputMode="decimal"
            onChange={(event) => update(entry.key, { amount: event.target.value })}
            placeholder="0"
            aria-label={`${entry.label || "Entry"} amount`}
            className="h-8 w-32 text-right tabular"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => removeRow(entry.key)}
            aria-label={`Remove ${entry.label || "row"}`}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={() => addRow(kind)} className="mt-1">
        <Plus /> Add {kind === "ASSET" ? "asset" : "liability"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-[var(--success)]" />
              Assets
            </CardTitle>
            <CardDescription>
              Cash, bank balances, your emergency fund, investments, anything you own.
            </CardDescription>
          </CardHeader>
          <CardContent>{renderGroup("ASSET", assets)}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="size-4 text-destructive" />
              Liabilities
            </CardTitle>
            <CardDescription>Loans, credit card balances, anything you owe.</CardDescription>
          </CardHeader>
          <CardContent>{renderGroup("LIABILITY", liabilities)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <Field label="Note" htmlFor="nw-note" hint="Optional — what changed this month.">
            <Input
              id="nw-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Paid off the phone loan"
            />
          </Field>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
            <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div>
                <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Assets
                </dt>
                <dd className="font-semibold">
                  <Money value={assetTotal} />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Liabilities
                </dt>
                <dd className="font-semibold">
                  <Money value={liabilityTotal} />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Net worth
                </dt>
                <dd className="text-lg font-semibold">
                  <Money value={netWorth} tone={netWorth < 0 ? "negative" : "none"} />
                </dd>
              </div>
            </dl>

            <div className="flex items-center gap-2">
              {snapshot ? (
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
                  <Trash2 /> Remove snapshot
                </Button>
              ) : null}
              <Button size="sm" onClick={handleSave} loading={saving}>
                <Save /> Save {formatMonthLabel(month)}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Remove the ${formatMonthLabel(month)} snapshot?`}
        description="Other months are unaffected, and you can record this month again at any time."
        onConfirm={handleDelete}
      />
    </div>
  );
}
