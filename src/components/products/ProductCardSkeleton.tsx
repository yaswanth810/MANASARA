export function ProductCardSkeleton() {
  return (
    <div className="card-surface overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[4/5] bg-soft-line" />
      {/* Info placeholder */}
      <div className="p-3 sm:p-4 space-y-2">
        <div className="h-3 bg-soft-line rounded-full w-1/3" />
        <div className="h-4 bg-soft-line rounded-full w-3/4" />
        <div className="h-4 bg-soft-line rounded-full w-1/4" />
      </div>
    </div>
  )
}
