export function RoomGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-card">
          <div className="h-44 animate-pulse bg-neutral-200" />
          <div className="space-y-2 p-4">
            <div className="h-5 w-2/3 animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
            <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function BookingListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-xl border border-neutral-100 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-2">
            <div className="h-5 w-40 animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-56 animate-pulse rounded bg-neutral-100" />
          </div>
          <div className="h-8 w-24 animate-pulse rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  )
}

export function PaymentSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border border-neutral-100 bg-white p-6 shadow-card">
      <div className="h-5 w-40 animate-pulse rounded bg-neutral-200" />
      <div className="h-12 w-full animate-pulse rounded bg-neutral-100" />
      <div className="h-12 w-full animate-pulse rounded bg-neutral-100" />
      <div className="h-10 w-full animate-pulse rounded bg-neutral-200" />
      <p className="text-center text-sm text-neutral-500">Preparing secure payment…</p>
    </div>
  )
}
