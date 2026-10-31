import { Skeleton } from "./skeleton";

/**
 * A grey outline of a typical page (title, then a few cards) shown while the next screen loads.
 * It appears the moment a link is tapped, so the app feels instant, and the header and menu stay put.
 */
export function PageSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <span className="sr-only">{label}</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className="space-y-3 rounded-card border border-border bg-surface p-4"
          >
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
