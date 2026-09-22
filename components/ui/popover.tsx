"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { OVERLAY_MOTION } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

/**
 * Floating panel anchored to its trigger, rendered in a portal.
 *
 * @param props - Radix `Popover.Content` props; `align` and `sideOffset` are pre-set.
 * @returns The portalled popover surface.
 */
function PopoverContent({
  className,
  align = "center",
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg outline-none",
          OVERLAY_MOTION,
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverContent, PopoverTrigger };
