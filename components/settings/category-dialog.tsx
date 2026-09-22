"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

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
import { Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createCategory, updateCategory } from "@/lib/actions/categories";
import { runAction } from "@/lib/client/run-action";
import { CATEGORY_KIND_LABELS } from "@/lib/labels";
import type { CategoryDTO, CategoryKind } from "@/lib/types";
import { categoryInputSchema } from "@/lib/validations/planning";

type CategoryFormValues = z.input<typeof categoryInputSchema>;

/**
 * Builds the form's starting values.
 *
 * @param category - The category being edited, or null when creating.
 * @returns Form values matching the schema's input shape.
 */
function toDefaults(category: CategoryDTO | null): CategoryFormValues {
  return {
    name: category?.name ?? "",
    kind: category?.kind ?? "EXPENSE",
    color: category?.color ?? "#2a78d6",
    icon: category?.icon ?? "Circle",
    carryForward: category?.carryForward ?? false,
  };
}

/**
 * Create/edit dialog for a category.
 *
 * @param props - The category being edited (null to create) and open state.
 * @returns The dialog.
 */
export function CategoryDialog({
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
    const saved = await runAction(
      () => (isEditing ? updateCategory({ id: category.id, data: values }) : createCategory(values)),
      { success: isEditing ? "Category updated" : `${values.name} added` },
    );

    if (saved) onOpenChange(false);
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
                  {Object.entries(CATEGORY_KIND_LABELS).map(([value, label]) => (
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
