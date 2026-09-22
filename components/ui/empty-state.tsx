import * as React from "react";

import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  /** Tighter padding, for an empty region inside a populated page. */
  compact?: boolean;
};

/**
 * Explains why a region is empty and offers the action that fills it, so a
 * month with no data never reads as something broken.
 *
 * @param props - Title, optional icon, description and call-to-action.
 * @returns The empty-state panel.
 */
export function EmptyState({
  title,
  icon: Icon,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-center",
        compact ? "gap-2 px-5 py-8" : "gap-3 px-6 py-14",
        className,
      )}
    >
      {Icon ? (
        <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </div>
      ) : null}

      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
