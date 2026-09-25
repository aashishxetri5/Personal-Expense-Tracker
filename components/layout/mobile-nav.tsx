"use client";

import { usePathname } from "next/navigation";

import { MOBILE_NAV_ITEMS, isActiveRoute } from "@/components/layout/nav-config";
import { MonthAwareLink } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
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
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
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
