"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { MONTH_AWARE_ROUTES, NAV_ITEMS, isActiveRoute } from "@/components/layout/nav-config";
import { MonthSelector } from "@/components/layout/month-selector";
import { SidebarBackdrop, SidebarBrand, SidebarNav } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { BrandMark } from "@/components/brand/brand-mark";
import { AddTransactionButton } from "@/components/transactions/transaction-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function Topbar({ name }: { name: string }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const current = NAV_ITEMS.find((item) => isActiveRoute(pathname, item.href));
  const showMonth = MONTH_AWARE_ROUTES.has(current?.href ?? pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
        {/* Mobile menu -------------------------------------------------- */}
        <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open menu">
              <Menu />
            </Button>
          </DialogTrigger>
          <DialogContent
            showClose={false}
            className={cn(
              "dark inset-y-0 right-auto bottom-auto left-0 h-dvh max-h-dvh w-[17rem] overflow-hidden rounded-none rounded-r-2xl border-r border-sidebar-border bg-sidebar text-foreground",
              "sm:inset-y-0 sm:top-0 sm:left-0 sm:max-h-dvh sm:w-[17rem] sm:translate-x-0 sm:translate-y-0 sm:rounded-none sm:rounded-r-2xl",
            )}
          >
            <DialogTitle className="sr-only">Navigation</DialogTitle>
            <SidebarBackdrop />
            <div className="relative flex min-h-0 flex-1 flex-col">
              <SidebarBrand name={name} />
              <div className="scrollbar-thin flex-1 overflow-y-auto pb-6">
                <SidebarNav onNavigate={() => setDrawerOpen(false)} />
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <BrandMark className="size-7 lg:hidden" />
        <h2 className="truncate font-display text-[1.35rem] leading-none lg:hidden">
          {current?.label ?? "Finance"}
        </h2>

        {showMonth ? <MonthSelector className="hidden sm:flex" /> : null}

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <SignOutButton />
          <AddTransactionButton size="sm" className="ml-1 hidden sm:inline-flex" />
        </div>
      </div>

      {/* Month selector gets its own row on small screens so it stays tappable. */}
      {showMonth ? (
        <div className="flex items-center justify-center border-t border-border/70 px-4 py-1.5 sm:hidden">
          <MonthSelector />
        </div>
      ) : null}
    </header>
  );
}
