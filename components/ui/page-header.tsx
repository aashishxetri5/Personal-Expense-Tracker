import * as React from "react";

import { PageEyebrow } from "@/components/ui/page-eyebrow";
import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

/**
 * A title set in the display face with its last word in brass italic —
 * "Savings *goals*", "September *2026*". A single word is set in brass whole.
 *
 * @param props - The title text.
 * @returns The title's inline content.
 */
export function AccentTitle({ title }: { title: string }) {
  const split = title.lastIndexOf(" ");
  if (split === -1) return <em className="text-gold-ink">{title}</em>;

  return (
    <>
      {title.slice(0, split)} <em className="text-gold-ink">{title.slice(split + 1)}</em>
    </>
  );
}

/**
 * Page title, supporting copy and the page's primary actions, ruled off from
 * the page like a heading in an account book.
 *
 * @param props - Title, optional description, and action slot.
 * @returns The page header.
 */
export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "relative flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pb-5 animate-[rise_0.4s_cubic-bezier(0.16,1,0.3,1)_both]",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        <PageEyebrow />
        <h1 className="font-display text-[1.9rem] leading-[1.1] font-medium tracking-[-0.02em] sm:text-[2.3rem]">
          <AccentTitle title={title} />
        </h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}

      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-border" />
      <div aria-hidden className="gold-rule absolute bottom-0 left-0 h-px w-28" />
    </header>
  );
}
