import { cn } from "@/lib/utils";

/**
 * The app's mark: a plain "F" monogram tile.
 *
 * @param props - Sizing classes; the letter scales with the tile.
 * @returns The mark, hidden from assistive technology.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "@container inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground",
        className,
      )}
    >
      <span className="text-[55cqi] leading-none font-semibold tracking-tight">F</span>
    </span>
  );
}
