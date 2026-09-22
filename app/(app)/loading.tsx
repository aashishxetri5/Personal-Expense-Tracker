import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown while a month's data is fetched. The shape mirrors the dashboard so the
 * layout does not jump when the real content arrives.
 */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-3 h-6 w-28" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-5 h-48 w-full" />
        </div>
        <div className="space-y-3 rounded-xl border border-border bg-card p-5 lg:col-span-2">
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
