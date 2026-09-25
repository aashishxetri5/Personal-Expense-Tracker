"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

/**
 * Segmented container holding the tab triggers.
 *
 * @param props - Radix `Tabs.List` props.
 * @returns The tab bar.
 */
function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-9 items-center gap-1 rounded-xl bg-muted/80 p-1 text-muted-foreground ring-1 ring-border/60",
        className,
      )}
      {...props}
    />
  );
}

/**
 * One selectable tab.
 *
 * @param props - Radix `Tabs.Trigger` props.
 * @returns The tab button.
 */
function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1 text-[13px] font-medium whitespace-nowrap transition-all outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        "rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-card",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Panel shown for the active tab.
 *
 * @param props - Radix `Tabs.Content` props.
 * @returns The tab panel.
 */
function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-4 outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
