"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { useChartTheme } from "@/components/charts/chart-kit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge, ColorDot } from "@/components/ui/display";
import { Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Switch,
} from "@/components/ui/primitives";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  archiveCategory,
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/actions/planning";
import type { CategoryDTO, CategoryKind } from "@/lib/types";
import { categoryInputSchema } from "@/lib/validations/planning";
import { cn } from "@/lib/utils";

const KIND_LABELS: Record<CategoryKind, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
  INVESTMENT: "Investment",
  SAVINGS: "Savings",
  FUTURE_FUND: "Future fund",
};

type CategoryFormValues = z.input<typeof categoryInputSchema>;

function toDefaults(category: CategoryDTO | null): CategoryFormValues {
  return {
    name: category?.name ?? "",
    kind: category?.kind ?? "EXPENSE",
    color: category?.color ?? "#2a78d6",
    icon: category?.icon ?? "Circle",
    carryForward: category?.carryForward ?? false,
  };
}

function CategoryDialog({
  category,
  open,
  onOpenChange,
}: {
  category: CategoryDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEditing = category !== null;
  const form = useForm<CategoryFormValues, unknown, z.output<typeof categoryInputSchema>>({
    resolver: zodResolver(categoryInputSchema),
    defaultValues: toDefaults(category),
  });

  React.useEffect(() => {
    if (open) form.reset(toDefaults(category));
  }, [category, form, open]);

  const onSubmit = form.handleSubmit(async (values) => {
    const result = isEditing
      ? await updateCategory({ id: category.id, data: values })
      : await createCategory(values);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(isEditing ? "Category updated" : `${values.name} added`);
    onOpenChange(false);
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            Categories drive budgeting and the spending breakdown.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="space-y-4">
            <Field label="Name" htmlFor="cat-name" required error={errors.name?.message}>
              <Input id="cat-name" autoFocus {...form.register("name")} />
            </Field>

            <Field label="Kind" htmlFor="cat-kind" hint="Determines how the category is counted.">
              <Select
                value={form.watch("kind") ?? "EXPENSE"}
                onValueChange={(value) => form.setValue("kind", value as CategoryKind)}
              >
                <SelectTrigger id="cat-kind">
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

            <Field label="Colour" htmlFor="cat-color">
              <ColorPicker
                value={form.watch("color") ?? "#2a78d6"}
                onChange={(next) => form.setValue("color", next, { shouldDirty: true })}
              />
            </Field>

            <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/40 px-3 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="cat-carry">Unspent amount rolls over</Label>
                <p className="text-xs text-muted-foreground">
                  For allowances like Lifestyle: what you do not spend stays available next month.
                </p>
              </div>
              <Switch
                id="cat-carry"
                checked={form.watch("carryForward") ?? false}
                onCheckedChange={(checked) => form.setValue("carryForward", checked)}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              {isEditing ? "Save changes" : "Add category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryRow({ category }: { category: CategoryDTO }) {
  const theme = useChartTheme();
  const [editing, setEditing] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const toggleArchive = async () => {
    const result = await archiveCategory({ id: category.id, archived: !category.archived });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(category.archived ? `${category.name} restored` : `${category.name} archived`);
  };

  const handleDelete = async () => {
    setPending(true);
    const result = await deleteCategory({ id: category.id });
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setConfirming(false);
    toast.success(
      result.data.archived
        ? `${category.name} is used by existing records, so it was archived instead`
        : `${category.name} deleted`,
    );
  };

  return (
    <li
      className={cn(
        "flex items-center gap-3 border-b border-border py-2.5 last:border-0",
        category.archived && "opacity-55",
      )}
    >
      <ColorDot color={theme.series(category.color)} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{category.name}</span>

      <span className="flex shrink-0 items-center gap-1.5">
        {category.carryForward ? <Badge variant="outline">Rolls over</Badge> : null}
        {category.futureFundId ? <Badge variant="primary">Fund</Badge> : null}
        {category.archived ? <Badge variant="outline">Archived</Badge> : null}
        <Badge>{KIND_LABELS[category.kind]}</Badge>
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${category.name}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={toggleArchive}>
            {category.archived ? (
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

      <CategoryDialog category={category} open={editing} onOpenChange={setEditing} />

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        loading={pending}
        title={`Delete ${category.name}?`}
        description="Categories used by transactions or budgets are archived instead, so past months keep their labels."
        onConfirm={handleDelete}
      />
    </li>
  );
}

export function CategoryManager({ categories }: { categories: CategoryDTO[] }) {
  const [creating, setCreating] = React.useState(false);
  const [showArchived, setShowArchived] = React.useState(false);

  const visible = showArchived ? categories : categories.filter((category) => !category.archived);
  const archivedCount = categories.filter((category) => category.archived).length;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Rename, recolour or add categories. Nothing is hardcoded.
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus /> Add
        </Button>
      </CardHeader>

      <CardContent>
        <ul>
          {visible.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </ul>

        {archivedCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => setShowArchived((prev) => !prev)}
          >
            {showArchived ? "Hide" : "Show"} {archivedCount} archived
          </Button>
        ) : null}
      </CardContent>

      <CategoryDialog category={null} open={creating} onOpenChange={setCreating} />
    </Card>
  );
}
