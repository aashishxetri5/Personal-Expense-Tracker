import { cn } from "@/lib/utils";

/**
 * How much of the month's budget has gone, as a plain ring. Amber past 85%,
 * red past the plan. Decorative — pair it with text that states the figures.
 *
 * @param props - The share used (100 = the whole plan; may exceed 100), or
 *                null when there is no budget, plus sizing classes.
 * @returns The gauge.
 */
export function BudgetGauge({ used, className }: { used: number | null; className?: string }) {
  const hasBudget = used !== null && Number.isFinite(used);
  const value = hasBudget ? Math.max(0, used) : 0;
  const shown = Math.min(100, value);
  const color =
    value > 100 ? "var(--destructive)" : value > 85 ? "var(--warning)" : "var(--foreground)";

  return (
    <div className={cn("@container relative shrink-0", className)} aria-hidden>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r="44" fill="none" strokeWidth="6" style={{ stroke: "var(--muted)" }} />
        {hasBudget && shown > 0 ? (
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${shown} 100`}
            className="transition-[stroke-dasharray] duration-700 ease-out"
            style={{ stroke: color }}
          />
        ) : null}
      </svg>
      <span className="tabular absolute inset-0 flex items-center justify-center text-[22cqi] font-semibold tracking-tight">
        {hasBudget ? `${Math.round(value)}%` : "—"}
      </span>
    </div>
  );
}
