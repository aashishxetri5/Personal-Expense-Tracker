import { cn } from "@/lib/utils";

/**
 * The app's mark: a brass "F" on an ink tile, set over a double rule — the
 * bookkeeper's mark for a total, the same rule that closes every table here.
 * Everything scales with the tile, so size it with `size-*` alone.
 *
 * @param props - Sizing classes.
 * @returns The mark, hidden from assistive technology.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "@container relative inline-flex size-9 shrink-0 flex-col items-center justify-center rounded-[28%]",
        "bg-linear-to-b from-[var(--ink-lift)] to-[var(--ink-deep)] ring-1 ring-gold/40",
        "shadow-[inset_0_1px_0_oklch(1_0_0/0.14),0_6px_14px_-6px_oklch(0.15_0.05_272/0.6)]",
        className,
      )}
    >
      <span className="font-display text-[62cqi] leading-[0.8] font-semibold text-gold-bright italic">F</span>
      <span className="mt-[9cqi] flex w-[42cqi] flex-col gap-[5cqi]">
        <span className="h-[5cqi] min-h-px rounded-full bg-gold" />
        <span className="h-[5cqi] min-h-px rounded-full bg-gold" />
      </span>
    </span>
  );
}
