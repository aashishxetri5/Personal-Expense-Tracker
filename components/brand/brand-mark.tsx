import { cn } from "@/lib/utils";

const TICKS = Array.from({ length: 12 }, (_, i) => i);

/**
 * The app's mark: a small brass combination dial, the lock screen's dial in
 * miniature. Solid fills only, so any number of marks can share a page.
 *
 * @param props - Sizing classes.
 * @returns The mark, hidden from assistive technology.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9 shrink-0", className)} aria-hidden>
      <circle cx="20" cy="20" r="19.5" style={{ fill: "var(--gold)" }} />
      {/* Light catching the top-left of the bezel. */}
      <path
        d="M2.27 16.87 A18 18 0 0 1 23.13 2.27"
        style={{ fill: "none", stroke: "var(--gold-bright)", strokeWidth: 1.6, strokeLinecap: "round" }}
      />
      <circle cx="20" cy="20" r="16.4" style={{ fill: "var(--ink-deep)" }} />
      <circle cx="20" cy="20" r="15" style={{ fill: "var(--ink)" }} />
      {TICKS.map((i) => {
        const major = i % 3 === 0;
        return (
          <line
            key={i}
            x1="20"
            y1="6.6"
            x2="20"
            y2={major ? 10.2 : 8.6}
            transform={`rotate(${i * 30} 20 20)`}
            style={{
              stroke: i === 0 ? "var(--gold-bright)" : "var(--gold)",
              strokeOpacity: major ? 1 : 0.55,
              strokeWidth: major ? 1.7 : 1,
              strokeLinecap: "round",
            }}
          />
        );
      })}
      <circle
        cx="20"
        cy="20"
        r="6.4"
        style={{ fill: "var(--ink-deep)", stroke: "var(--gold)", strokeOpacity: 0.6, strokeWidth: 1 }}
      />
      <circle cx="20" cy="20" r="2.1" style={{ fill: "var(--gold-bright)" }} />
    </svg>
  );
}
