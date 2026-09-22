"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Download, FileJson, Table2, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/primitives";
import { deleteAllData } from "@/lib/actions/settings";

const EXPORTS = [
  { href: "/api/export/transactions?all=1", label: "Transactions", icon: Table2, hint: "Every transaction, CSV" },
  { href: "/api/export/history", label: "Monthly history", icon: Table2, hint: "Month totals, CSV" },
  { href: "/api/export/budget", label: "Budgets", icon: Table2, hint: "Every month's plan, CSV" },
  { href: "/api/export/backup", label: "Full backup", icon: FileJson, hint: "Everything, JSON" },
];

export function DataSection({ demoDataLoaded }: { demoDataLoaded: boolean }) {
  const [confirmDemo, setConfirmDemo] = React.useState(false);
  const [wipeOpen, setWipeOpen] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const removeDemo = async () => {
    setPending(true);
    const result = await deleteAllData({ confirmation: "DELETE", demoOnly: true });
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setConfirmDemo(false);
    toast.success(`Removed ${result.data.deleted} demo records`);
  };

  const wipeEverything = async () => {
    setPending(true);
    const result = await deleteAllData({ confirmation, demoOnly: false });
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setWipeOpen(false);
    setConfirmation("");
    toast.success(`Deleted ${result.data.deleted} records`, {
      description: "Your categories, funds, goals and payment methods were kept.",
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
          <CardDescription>
            Your data is yours. Take it out as spreadsheet-ready CSV or a complete JSON backup.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {EXPORTS.map((item) => (
            <Button key={item.href} variant="outline" className="h-auto justify-start gap-3 py-3" asChild>
              <Link href={item.href} prefetch={false}>
                <item.icon className="shrink-0 text-muted-foreground" />
                <span className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-xs font-normal text-muted-foreground">{item.hint}</span>
                </span>
                <Download className="ml-auto shrink-0 text-muted-foreground" />
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-destructive/25">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" />
            Danger zone
          </CardTitle>
          <CardDescription>These actions cannot be undone. Export a backup first.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {demoDataLoaded ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Remove demo data</p>
                <p className="text-xs text-muted-foreground">
                  Deletes only the sample records the seed script created. Anything you entered
                  yourself is untouched.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setConfirmDemo(true)}>
                Remove demo data
              </Button>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Delete all financial data</p>
              <p className="text-xs text-muted-foreground">
                Removes every transaction, budget and net-worth snapshot. Your categories, funds,
                goals and payment methods are kept so you can start again straight away.
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setWipeOpen(true)}>
              <Trash2 /> Delete everything
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDemo}
        onOpenChange={setConfirmDemo}
        loading={pending}
        confirmLabel="Remove demo data"
        title="Remove the demo data?"
        description="Only records flagged as demo are removed. Anything you entered yourself stays."
        onConfirm={removeDemo}
      />

      {/* A typed confirmation, because this one really is irreversible. */}
      <Dialog open={wipeOpen} onOpenChange={setWipeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete all financial data?</DialogTitle>
            <DialogDescription>
              Every transaction, budget and net-worth snapshot will be permanently removed. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <Field
              label="Type DELETE to confirm"
              htmlFor="wipe-confirm"
              hint="Case sensitive."
            >
              <Input
                id="wipe-confirm"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder="DELETE"
                autoComplete="off"
              />
            </Field>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWipeOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={wipeEverything}
              loading={pending}
              disabled={confirmation !== "DELETE"}
            >
              <Trash2 /> Delete everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
