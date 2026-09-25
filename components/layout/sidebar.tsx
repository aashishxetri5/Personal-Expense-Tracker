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
    <nav className="flex flex-col gap-6 px-3 py-2" aria-label="Main">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="space-y-1">
          <p className="flex items-center gap-2 px-3 pb-1.5 text-[10px] font-semibold tracking-[0.2em] text-gold-ink/80 uppercase">
            {section.label}
            <span aria-hidden className="h-px flex-1 bg-linear-to-r from-gold/30 to-transparent" />
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
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      active
                        ? "bg-linear-to-r from-gold/15 via-gold/5 to-transparent text-foreground"
                        : "text-sidebar-foreground/70 hover:bg-white/[0.04] hover:text-foreground",
                    )}
                  >
                    {active ? (
                      <span
                        aria-hidden
                        className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-gold shadow-[0_0_12px_var(--gold)]"
                      />
                    ) : null}
                    <item.icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active ? "text-gold-bright" : "text-muted-foreground group-hover:text-foreground",
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
    <div className="flex items-center gap-3 px-5 pt-5 pb-5">
      <BrandMark className="size-9" />
      <span className="flex min-w-0 flex-col">
        <span className="font-display text-[1.2rem] leading-none font-semibold tracking-[-0.02em] text-foreground">
          Finance
        </span>
        <span className="mt-1 truncate text-[11px] text-muted-foreground">
          {name}
        </span>
      </span>
    </div>
  );
}

/** Ink, ruled lines and a little light — the sidebar reads as the vault's cover. */
export function SidebarBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-ledger [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(22rem_20rem_at_0%_0%,color-mix(in_oklch,var(--primary)_24%,transparent),transparent_70%),radial-gradient(20rem_18rem_at_100%_100%,color-mix(in_oklch,var(--gold)_10%,transparent),transparent_70%)]" />
    </div>
  );
}

function SidebarMotto() {
  return (
    <div className="mx-3 mb-3 rounded-xl border border-sidebar-border bg-white/[0.03] px-4 py-3">
      <p className="font-display text-[14px] leading-snug font-medium text-gold-ink italic">Every coin counted.</p>
      <p className="text-[11px] text-muted-foreground">Every month remembered.</p>
    </div>
  );
}

export function Sidebar({ name }: { name: string }) {
  return (
    // `dark` scopes the ink palette to the sidebar in both themes.
    <aside className="dark fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-foreground lg:flex">
      <SidebarBackdrop />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <SidebarBrand name={name} />
        <div className="scrollbar-thin flex-1 overflow-y-auto pb-6">
          <SidebarNav />
        </div>
        <SidebarMotto />
      </div>
    </aside>
  );
}
