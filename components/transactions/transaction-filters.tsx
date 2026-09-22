"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const ANY = "__any__";

const TYPE_LABELS: Record<string, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
  INVESTMENT: "Investment",
  TRANSFER: "Transfer",
};

const SORT_LABELS: Record<string, string> = {
  "date-desc": "Newest first",
  "date-asc": "Oldest first",
  "amount-desc": "Largest amount",
  "amount-asc": "Smallest amount",
};

/**
 * Filters live in the URL so a filtered view can be shared or bookmarked, and
 * so the back button behaves the way people expect.
 */
export function TransactionFilters({
  categories,
  className,
}: {
  categories: CategoryDTO[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = React.useTransition();

  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");
  const searchRef = React.useRef(search);

  const update = React.useCallback(
    (changes: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      // Any filter change invalidates the current page number.
      if (!("page" in changes)) params.delete("page");

      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  // Debounced search so each keystroke does not hit the database.
  React.useEffect(() => {
    searchRef.current = search;
    const timeout = setTimeout(() => {
      if (searchRef.current === (searchParams.get("search") ?? "")) return;
      update({ search: searchRef.current || null });
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, searchParams, update]);

  const type = searchParams.get("type") ?? ANY;
  const categoryId = searchParams.get("categoryId") ?? ANY;
  const sort = searchParams.get("sort") ?? "date-desc";
  const showAllMonths = searchParams.get("all") === "1";

  const activeCount = [
    searchParams.get("search"),
    searchParams.get("type"),
    searchParams.get("categoryId"),
  ].filter(Boolean).length;

  const grouped = React.useMemo(() => {
    const byKind = new Map<string, CategoryDTO[]>();
    for (const category of categories) {
      if (category.archived) continue;
      const list = byKind.get(category.kind) ?? [];
      list.push(category);
      byKind.set(category.kind, list);
    }
    return byKind;
  }, [categories]);

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center", className)}>
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search transactions…"
          aria-label="Search transactions"
          className="pl-9"
        />
        {search ? (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={type}
          onValueChange={(value) => update({ type: value === ANY ? null : value })}
        >
          <SelectTrigger size="sm" className="w-[9rem]" aria-label="Filter by type">
            <SelectValue placeholder="Any type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any type</SelectItem>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={categoryId}
          onValueChange={(value) => update({ categoryId: value === ANY ? null : value })}
        >
          <SelectTrigger size="sm" className="w-[11rem]" aria-label="Filter by category">
            <SelectValue placeholder="Any category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any category</SelectItem>
            {[...grouped.entries()].map(([kind, list]) => (
              <SelectGroup key={kind}>
                <SelectLabel>{kind.replace("_", " ").toLowerCase()}</SelectLabel>
                {list.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(value) => update({ sort: value })}>
          <SelectTrigger size="sm" className="w-[10rem]" aria-label="Sort transactions">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={showAllMonths ? "secondary" : "outline"}
          size="sm"
          onClick={() => update({ all: showAllMonths ? null : "1" })}
        >
          <SlidersHorizontal />
          {showAllMonths ? "All months" : "This month"}
        </Button>

        {activeCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              update({ search: null, type: null, categoryId: null });
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
