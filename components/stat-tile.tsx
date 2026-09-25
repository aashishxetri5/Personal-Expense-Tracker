import * as React from "react";

import { Money } from "@/components/money";
import { cn } from "@/lib/utils";

export type StatTileProps = {
  label: string;
  /** Formatted as currency. Pass `text` instead for non-money figures. */
  value?: number;
  /** Rendered verbatim — a percentage or a count. */
  text?: string;
  tone?: "auto" | "positive" | "negative" | "none";
  badge?: React.ReactNode;
  className?: string;
};

/**
 * One headline figure with its label, used across every page so the summary
 * strips stay identical.
 *
 * @param props - Label plus either a currency `value` or plain `text`.
 * @returns The stat tile.
 */
export function StatTile({
  label,
  value,
  text,
  tone = "none",
  badge,
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/80 bg-card px-4 py-3.5 shadow-card",
        className,
      )}
    >
      <p className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-gold" />
        {label}
      </p>
      <p className="mt-1.5 flex items-center gap-2 text-xl font-semibold tracking-tight">
        {value !== undefined ? <Money value={value} tone={tone} /> : <span className="tabular">{text}</span>}
        {badge}
      </p>
    </div>
  );
}
