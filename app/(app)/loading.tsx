import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown while a month's data is fetched. The shape mirrors the dashboard so the
 * layout does not jump when the real content arrives.
 */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      <div className="dark rounded-3xl border border-sidebar-border bg-sidebar p-6 sm:p-8">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-4 h-9 w-64" />
        <Skeleton className="mt-8 h-3 w-24" />
        <Skeleton className="mt-3 h-12 w-56" />
        <Skeleton className="mt-7 h-3 w-full max-w-2xl rounded-full" />
        <div className="mt-5 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-9" />
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-card lg:col-span-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-5 h-48 w-full" />
        </div>
        <div className="space-y-3 rounded-2xl border border-border/80 bg-card p-5 shadow-card lg:col-span-2">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-2 pt-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-1.5 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
