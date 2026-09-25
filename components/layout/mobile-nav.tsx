"use client";

import { usePathname } from "next/navigation";

import { MOBILE_NAV_ITEMS, isActiveRoute } from "@/components/layout/nav-config";
import { MonthAwareLink } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    // A floating ink dock; `dark` keeps it ink in both themes, like the sidebar.
    <nav
      aria-label="Primary"
      className="dark fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar text-foreground shadow-[0_18px_40px_-12px_oklch(0.12_0.03_272/0.55)] lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          return (
            <li key={item.href}>
              <MonthAwareLink
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-gold-bright" : "text-muted-foreground",
                )}
              >
                {active ? (
                  <span
                    aria-hidden
                    className="absolute top-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-b-full bg-gold shadow-[0_0_12px_var(--gold)]"
                  />
                ) : null}
                <item.icon className="size-5" />
                {item.shortLabel}
              </MonthAwareLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
