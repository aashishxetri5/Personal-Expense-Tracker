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
        "relative isolate flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30 text-center",
        compact ? "gap-2 px-5 py-8" : "gap-3 px-6 py-14",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-ledger [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />

      {Icon ? (
        <div className="relative flex size-11 items-center justify-center rounded-full bg-linear-to-br from-gold-bright/45 to-gold/25 text-gold-ink ring-1 ring-gold/40">
          <span aria-hidden className="absolute inset-1 rounded-full border border-dashed border-gold/50" />
          <Icon className="relative size-5" />
        </div>
      ) : null}

      <div className="space-y-1">
        <p className="font-display text-[1.05rem] leading-snug font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
