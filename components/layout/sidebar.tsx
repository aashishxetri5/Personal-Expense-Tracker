"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/brand/brand-mark";
import { MONTH_AWARE_ROUTES, NAV_SECTIONS, isActiveRoute } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

/**
 * A nav link that carries the selected month across pages, so moving between
 * screens keeps you in the same month.
 *
 * Every page is dynamic, so the default prefetch only fetches the loading
 * skeleton. Instead the full page is prefetched the moment a pointer or focus
 * lands on the link — usually long enough before the click for the page to be
 * ready, without rendering every page on every load.
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = searchParams.get("m");
  const target = month && MONTH_AWARE_ROUTES.has(href) ? `${href}?m=${month}` : href;
  const prefetch = () => router.prefetch(target);

  return (
    <Link
      href={target}
      className={className}
      onClick={onNavigate}
      onPointerEnter={prefetch}
      onFocus={prefetch}
      onTouchStart={prefetch}
      {...props}
    >
      {children}
    </Link>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-5 px-3 py-2" aria-label="Main">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="space-y-0.5">
          <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">{section.label}</p>
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
                      "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      active
                        ? "bg-muted font-medium text-foreground"
                        : "text-sidebar-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <item.icon
                      className={cn("size-4 shrink-0", active ? "text-foreground" : "text-muted-foreground")}
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
      <BrandMark className="size-7" />
      <span className="flex min-w-0 flex-col leading-tight">
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
