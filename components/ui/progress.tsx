"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const indicatorVariants = cva(
  "h-full w-full flex-1 rounded-full transition-transform duration-500 ease-out",
  {
    variants: {
      tone: {
        default: "bg-primary",
        success: "bg-[var(--success)]",
        warning: "bg-[var(--warning)]",
        danger: "bg-destructive",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

export type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> &
  VariantProps<typeof indicatorVariants>;

/**
 * Determinate progress bar. The value is clamped so an over-budget line fills
 * the track rather than overflowing it.
 *
 * @param props - Radix `Progress.Root` props plus `tone` for the fill colour.
 * @returns The progress bar.
 */
export function Progress({ value = 0, tone, className, ...props }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value ?? 0));

  return (
    <ProgressPrimitive.Root
      value={clamped}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(indicatorVariants({ tone }))}
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
