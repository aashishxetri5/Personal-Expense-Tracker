"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { useMoney } from "@/components/providers";
import { OTHER_COLOR, resolveSeriesColor } from "@/lib/chart-colors";
import { cn } from "@/lib/utils";

/**
 * Shared chart furniture: theme-aware colours, a consistent tooltip, and a
 * legend that carries values so identity is never conveyed by colour alone.
 */

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return React.useMemo(
    () => ({
      isDark,
      /** Re-step a stored entity colour for the current surface. */
      series: (hex: string) => resolveSeriesColor(hex, isDark),
      other: isDark ? OTHER_COLOR.dark : OTHER_COLOR.light,
      grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.07)",
      axis: isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)",
      surface: isDark ? "#131722" : "#ffffff",
      cursor: isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.06)",
    }),
    [isDark],
  );
}

export type TooltipRow = { label: string; value: number; color?: string };

export function ChartTooltipCard({
  title,
  rows,
  footer,
}: {
  title: string;
  rows: TooltipRow[];
  footer?: React.ReactNode;
}) {
  const money = useMoney();

  return (
    <div className="pointer-events-none min-w-40 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-popover-foreground">{title}</p>
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {row.color ? (
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
              ) : null}
              {row.label}
            </span>
            <span className="font-medium tabular text-popover-foreground">
              {money.format(row.value)}
            </span>
          </li>
        ))}
      </ul>
      {footer ? <div className="mt-1.5 border-t border-border pt-1.5 text-muted-foreground">{footer}</div> : null}
    </div>
  );
}

/** Legend entries double as direct labels, which is what makes the low-contrast
 *  slots on the light surface legible. */
export function ChartLegend({
  items,
  className,
  showValues = true,
}: {
  items: { label: string; value: number; color: string; meta?: string }[];
  className?: string;
  showValues?: boolean;
}) {
  const money = useMoney();

  return (
    <ul className={cn("space-y-1.5", className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate text-foreground">{item.label}</span>
            {item.meta ? (
              <span className="shrink-0 text-xs text-muted-foreground">{item.meta}</span>
            ) : null}
          </span>
          {showValues ? (
            <span className="shrink-0 font-medium tabular text-foreground">
              {money.format(item.value)}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** Every chart is paired with a readable table for screen readers. */
export function ChartDataTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: string[];
  rows: (string | number)[][];
}) {
  const money = useMoney();

  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{typeof cell === "number" ? money.format(cell) : cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const AXIS_TICK = { fontSize: 11, fontVariantNumeric: "tabular-nums" as const };
