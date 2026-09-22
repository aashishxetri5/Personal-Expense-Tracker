"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Wallet } from "lucide-react";

import { MONTH_AWARE_ROUTES, NAV_SECTIONS, isActiveRoute } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

/**
 * A nav link that carries the selected month across pages, so moving between
 * screens keeps you in the same month.
 *
 * @param props - Link props plus an optional navigation callback.
 * @returns The link, with the month appended where the route supports it.
 */
export function MonthAwareLink({
  href,
  children,
  className,
  onNavigate,
  ...props
}: React.ComponentProps<typeof Link> & { href: string; onNavigate?: () => void }) {
  const searchParams = useSearchParams();
  const month = searchParams.get("m");
  const target = month && MONTH_AWARE_ROUTES.has(href) ? `${href}?m=${month}` : href;

  return (
    <Link href={target} className={className} onClick={onNavigate} {...props}>
      {children}
    </Link>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-5 px-3 py-2" aria-label="Main">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="space-y-1">
          <p className="px-3 pb-1 text-[10.5px] font-semibold tracking-[0.08em] text-muted-foreground/80 uppercase">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              return (
                <li key={item.href}>
                  <MonthAwareLink
                    href={item.href}
                    onNavigate={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      active
                        ? "bg-card text-foreground shadow-xs ring-1 ring-border"
                        : "text-sidebar-foreground hover:bg-card/60 hover:text-foreground",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    {item.label}
                  </MonthAwareLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function SidebarBrand({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-4">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Wallet className="size-4" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-tight">Finance</span>
        <span className="truncate text-xs text-muted-foreground">{name}</span>
      </span>
    </div>
  );
}

export function Sidebar({ name }: { name: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <SidebarBrand name={name} />
      <div className="scrollbar-thin flex-1 overflow-y-auto pb-6">
        <SidebarNav />
      </div>
    </aside>
  );
}
