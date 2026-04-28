// Skeleton row that mirrors the layout of a real product hit in the search
// dropdowns (image square + two text lines). Used by ProductPicker and
// ProductSearchAdd while the debounced /api/products fetch is in flight.
function SkeletonRow() {
  return (
    <div className="flex w-full animate-pulse items-center gap-3 p-2">
      <div className="h-10 w-10 shrink-0 rounded bg-muted" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="h-3 w-3/4 rounded bg-muted" />
        <div className="h-2.5 w-1/2 rounded bg-muted" />
      </div>
    </div>
  );
}

export function ProductSearchSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-live="polite" aria-label="Searching products">
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
