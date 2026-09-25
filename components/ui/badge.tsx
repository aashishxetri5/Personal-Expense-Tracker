import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap transition-colors [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-muted-foreground",
        primary: "border-transparent bg-primary/10 text-primary",
        gold: "border-transparent bg-gold/15 text-gold-ink",
        success: "border-transparent bg-[var(--success)]/12 text-[var(--success)]",
        warning:
          "border-transparent bg-[var(--warning)]/15 text-[color-mix(in_oklch,var(--warning)_75%,black)] dark:text-[var(--warning)]",
        destructive: "border-transparent bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

/**
 * Small status chip.
 *
 * @param props - Span props plus `variant` for the colour treatment.
 * @returns The badge element.
 */
export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
