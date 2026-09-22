"use client";

import { useMoney } from "@/components/providers";
import { cn } from "@/lib/utils";

/**
 * Renders an amount in the user's currency, reformatting everywhere when the
 * currency setting changes.
 *
 * @param props - The amount plus sign, decimal and colour options.
 * @returns The formatted amount.
 */
export function Money({
  value,
  className,
  signed = false,
  decimals = false,
  tone,
}: {
  value: number;
  className?: string;
  signed?: boolean;
  decimals?: boolean;
  /** Colour by direction. "auto" derives it from the sign. */
  tone?: "auto" | "positive" | "negative" | "muted" | "none";
}) {
  const money = useMoney();
  const resolved = tone === "auto" ? (value > 0 ? "positive" : value < 0 ? "negative" : "muted") : tone;

  return (
    <span
      className={cn(
        "tabular",
        resolved === "positive" && "text-[var(--success)]",
        resolved === "negative" && "text-destructive",
        resolved === "muted" && "text-muted-foreground",
        className,
      )}
    >
      {money.format(value, { signed, decimals })}
    </span>
  );
}

/** Plain grouped number with no currency code — for dense tables. */
export function Amount({ value, className }: { value: number; className?: string }) {
  const money = useMoney();
  return <span className={cn("tabular", className)}>{money.formatPlain(value)}</span>;
}
