import type { CSSProperties } from "react";

import styles from "@/components/dashboard/budget-gauge.module.css";
import { cn } from "@/lib/utils";

/** The arc spans 270°, opening at the bottom. */
const SWEEP = 0.75;
const START_ANGLE = 135;
const TICKS = Array.from({ length: 11 }, (_, i) => i * 10);

/**
 * How much of the month's budget has gone, as a brass arc with a tick for each
 * tenth. Amber past 85%, red past the plan. Decorative — pair it with text
 * that states the same figures.
 *
 * @param props - The share used (100 = the whole plan; may exceed 100), or
 *                null when there is no budget, plus sizing classes.
 * @returns The gauge.
 */
export function BudgetGauge({ used, className }: { used: number | null; className?: string }) {
  const hasBudget = used !== null && Number.isFinite(used);
  const value = hasBudget ? Math.max(0, used) : 0;
  const shown = Math.min(100, value);
  const tone = value > 100 ? "danger" : value > 85 ? "warning" : "gold";

  return (
    <div className={cn(styles.gauge, className)} data-tone={tone} aria-hidden>
      <svg className={styles.svg} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="budget-gauge-fill" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" style={{ stopColor: "var(--gold-deep)" }} />
            <stop offset="0.5" style={{ stopColor: "var(--gold)" }} />
            <stop offset="1" style={{ stopColor: "var(--gold-bright)" }} />
          </linearGradient>
        </defs>

        {TICKS.map((at) => {
          const major = at % 50 === 0;
          return (
            <line
              key={at}
              x1={major ? 190 : 191}
              y1="100"
              x2="197"
              y2="100"
              transform={`rotate(${START_ANGLE + at * 2.7} 100 100)`}
              className={cn(styles.tick, hasBudget && at <= shown && styles.tickLit)}
              style={{ "--at": at / 100 } as CSSProperties}
            />
          );
        })}

        <circle
          cx="100"
          cy="100"
          r="78"
          pathLength={100}
          strokeDasharray={`${SWEEP * 100} 100`}
          transform={`rotate(${START_ANGLE} 100 100)`}
          className={styles.track}
        />
        {hasBudget && shown > 0 ? (
          <circle
            cx="100"
            cy="100"
            r="78"
            pathLength={100}
            strokeDasharray={`${SWEEP * shown} 100`}
            transform={`rotate(${START_ANGLE} 100 100)`}
            className={styles.fill}
            stroke={tone === "gold" ? "url(#budget-gauge-fill)" : undefined}
          />
        ) : null}
      </svg>

      <div className={styles.centre}>
        <span className={styles.figure}>
          {hasBudget ? (
            <>
              {Math.round(value)}
              <span className={styles.percent}>%</span>
            </>
          ) : (
            "—"
          )}
        </span>
        <span className={styles.caption}>{hasBudget ? "of budget" : "no budget"}</span>
      </div>
    </div>
  );
}
