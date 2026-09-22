"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { useChartTheme } from "@/components/charts/chart-kit";
import { CategoryDialog } from "@/components/settings/category-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorDot } from "@/components/ui/color-dot";
import { EntityActions } from "@/components/ui/entity-actions";
import { archiveCategory, deleteCategory } from "@/lib/actions/categories";
import { CATEGORY_KIND_LABELS } from "@/lib/labels";
import type { CategoryDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * One category row with its badges and actions menu.
 *
 * @param props - The category to render.
 * @returns The list row.
 */
function CategoryRow({ category }: { category: CategoryDTO }) {
  const theme = useChartTheme();
  const [editing, setEditing] = React.useState(false);

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
        <Badge>{CATEGORY_KIND_LABELS[category.kind]}</Badge>
      </span>

      <EntityActions
        name={category.name}
        archived={category.archived}
        onEdit={() => setEditing(true)}
        archive={(archived) => archiveCategory({ id: category.id, archived })}
        remove={() => deleteCategory({ id: category.id })}
        deleteDescription="Categories used by transactions or budgets are archived instead, so past months keep their labels."
      />

      <CategoryDialog category={editing ? category : null} open={editing} onOpenChange={setEditing} />
    </li>
  );
}

/**
 * Lists and manages spending categories, hiding archived ones until asked.
 *
 * @param props - Every category belonging to the user.
 * @returns The categories card.
 */
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
          <CardDescription>Rename, recolour or add categories. Nothing is hardcoded.</CardDescription>
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
