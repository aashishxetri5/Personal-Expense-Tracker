import { cn } from "@/lib/utils";

/**
 * Coloured dot that keys a category to its slice or bar in a chart.
 *
 * @param props - `color` as a hex string, plus optional `className`.
 * @returns The dot element.
 */
export function ColorDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("size-2.5 shrink-0 rounded-full ring-1 ring-black/5", className)}
      style={{ backgroundColor: color }}
    />
  );
}
