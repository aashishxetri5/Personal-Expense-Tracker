import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Placeholders shaped like the real blocks they stand in for, so a page can
 * render its header straight away and fill each section in as its data lands
 * without the layout jumping.
 */

const SURFACE = "rounded-2xl border border-border/80 bg-card shadow-card";

/** A row of stat tiles. */
export function StatsSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={cn(SURFACE, "px-4 py-3.5")}>
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="mt-3 h-6 w-28" />
        </div>
      ))}
    </div>
  );
}

/** A card with a title, a description and either a chart area or text rows. */
export function CardSkeleton({
  variant = "rows",
  rows = 4,
  chartHeight = 220,
  className,
}: {
  variant?: "rows" | "chart" | "bars";
  rows?: number;
  chartHeight?: number;
  className?: string;
}) {
  return (
    <div className={cn(SURFACE, "p-5", className)}>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-2.5 h-3 w-64 max-w-full" />
      {variant === "chart" ? (
        <Skeleton className="mt-6 w-full rounded-xl" style={{ height: chartHeight }} />
      ) : (
        <div className="mt-6 space-y-4">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between gap-4">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              {variant === "bars" ? <Skeleton className="h-1.5 w-full rounded-full" /> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** A card holding a table: a header rule and a stack of rows. */
export function TableSkeleton({ rows = 8, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn(SURFACE, "p-5", className)}>
      <div className="flex gap-6 border-b-[3px] border-double border-border pb-3">
        {[16, 40, 24, 16].map((width, index) => (
          <Skeleton key={index} className="h-2.5" style={{ width: `${width}%` }} />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-6 py-3.5">
            <Skeleton className="h-3 w-[12%]" />
            <Skeleton className="h-3 w-[34%]" />
            <Skeleton className="h-3 w-[20%]" />
            <Skeleton className="ml-auto h-3 w-[12%]" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A grid of entity cards — funds, goals, investments. */
export function CardGridSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={cn(SURFACE, "p-5")}>
          <div className="flex items-center gap-2">
            <Skeleton className="size-2.5 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="mt-5 h-7 w-36" />
          <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
