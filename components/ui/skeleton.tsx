import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Shimmering placeholder used while a page loads.
 *
 * @param props - Div props; size it with `className`.
 * @returns The placeholder block.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.6s_infinite] after:bg-gradient-to-r after:from-transparent after:via-foreground/[0.05] after:to-transparent",
        className,
      )}
      {...props}
    />
  );
}
