import * as React from "react";

import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

/**
 * Page title, supporting copy and the page's primary actions.
 *
 * @param props - Title, optional description, and action slot.
 * @returns The page header.
 */
export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </header>
  );
}
