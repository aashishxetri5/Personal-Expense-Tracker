"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  addMonths,
  currentMonth,
  formatMonthLabel,
  isSameMonth,
  parseMonthKey,
  toMonthKey,
} from "@/lib/month";
import { cn } from "@/lib/utils";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * The control that drives every month-aware screen. The month lives in the URL,
 * so it survives a refresh, can be shared, and re-renders without a reload.
 *
 * @param props - Optional class name for the wrapper.
 * @returns The month stepper with its picker popover.
 */
export function MonthSelector({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState(false);

  const selected = parseMonthKey(searchParams.get("m"));
  const [pickerYear, setPickerYear] = React.useState(selected.getUTCFullYear());

  React.useEffect(() => {
    if (open) setPickerYear(selected.getUTCFullYear());
  }, [open, selected]);

  const navigate = React.useCallback(
    (month: Date) => {
      const params = new URLSearchParams(searchParams.toString());
      const key = toMonthKey(month);

      if (isSameMonth(month, currentMonth())) params.delete("m");
      else params.set("m", key);

      // Changing month always returns to the first page of any list.
      params.delete("page");

      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const isCurrent = isSameMonth(selected, currentMonth());

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => navigate(addMonths(selected, -1))}
        aria-label={`Go to ${formatMonthLabel(addMonths(selected, -1))}`}
      >
        <ChevronLeft />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 min-w-[9.5rem] justify-center gap-2 px-2 text-sm font-semibold tabular"
            aria-label={`Selected month: ${formatMonthLabel(selected)}. Change month`}
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            ) : (
              <CalendarDays className="size-3.5 text-muted-foreground" />
            )}
            {formatMonthLabel(selected)}
          </Button>
        </PopoverTrigger>

        <PopoverContent align="center" className="w-[17rem] p-3">
          <div className="mb-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setPickerYear((year) => year - 1)}
              aria-label={`Show ${pickerYear - 1}`}
            >
              <ChevronLeft />
            </Button>
            <span className="text-sm font-semibold tabular">{pickerYear}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setPickerYear((year) => year + 1)}
              aria-label={`Show ${pickerYear + 1}`}
            >
              <ChevronRight />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {MONTH_LABELS.map((label, index) => {
              const month = new Date(Date.UTC(pickerYear, index, 1));
              const active = isSameMonth(month, selected);
              const isThisMonth = isSameMonth(month, currentMonth());

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    navigate(month);
                    setOpen(false);
                  }}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "relative rounded-lg px-2 py-2 text-[13px] font-medium transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  {label}
                  {isThisMonth && !active ? (
                    <span className="absolute inset-x-0 bottom-1 mx-auto size-1 rounded-full bg-primary" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            disabled={isCurrent}
            onClick={() => {
              navigate(currentMonth());
              setOpen(false);
            }}
          >
            Jump to this month
          </Button>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => navigate(addMonths(selected, 1))}
        aria-label={`Go to ${formatMonthLabel(addMonths(selected, 1))}`}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
