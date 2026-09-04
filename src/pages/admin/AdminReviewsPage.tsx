import { useMemo, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Star, User } from 'lucide-react'
import { getRoomTypeReviews, listRoomTypes } from '../../api/hotel'
import { BookingListSkeleton } from '../../components/ui/Skeletons'
import { aggregateOverallReviews } from '../../utils/reviewAggregates'

export function AdminReviewsPage() {
  const typesQuery = useQuery({ queryKey: ['room-types'], queryFn: listRoomTypes })
  const roomTypes = typesQuery.data?.roomTypes ?? []

  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('all')
  const [starFilter, setStarFilter] = useState<number | 'all'>('all')

  const allReviewQueries = useQueries({
    queries: roomTypes.map((t) => ({
      queryKey: ['roomtype-reviews', t.id],
      queryFn: () => getRoomTypeReviews(t.id, 1, 50),
      enabled: roomTypes.length > 0,
    })),
  })

  const singleReviewQuery = useQuery({
    queryKey: ['roomtype-reviews', selectedRoomTypeId],
    queryFn: () => getRoomTypeReviews(selectedRoomTypeId, 1, 50),
    enabled: selectedRoomTypeId !== 'all',
  })

  const { reviews, avgRating, totalReviews, isLoading } = useMemo(() => {
    if (selectedRoomTypeId === 'all') {
      const allReviews = allReviewQueries.flatMap((q) => q.data?.reviews ?? [])
      const { avgRating: avg, totalReviews: total } = aggregateOverallReviews(
        allReviewQueries.map((q) => ({
          total: q.data?.total ?? 0,
          averageRating: q.data?.averageRating ?? 0,
        })),
      )
      return {
        reviews: allReviews.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
        avgRating: avg,
        totalReviews: total,
        isLoading: allReviewQueries.some((q) => q.isLoading),
      }
    }

    return {
      reviews: singleReviewQuery.data?.reviews ?? [],
      avgRating: singleReviewQuery.data?.averageRating ?? 0,
      totalReviews: singleReviewQuery.data?.total ?? 0,
      isLoading: singleReviewQuery.isLoading,
    }
  }, [selectedRoomTypeId, allReviewQueries, singleReviewQuery.data, singleReviewQuery.isLoading])

  const filteredReviews = useMemo(() => {
    if (starFilter === 'all') return reviews
    return reviews.filter((r) => r.rating === starFilter)
  }, [reviews, starFilter])

  const ratingCounts = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((r) => {
      if (counts[r.rating] !== undefined) counts[r.rating]++
    })
    return counts
  }, [reviews])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-primary">Guest Satisfaction & Reviews</h2>
        <p className="text-xs text-neutral-500">
          Monitor verified guest sentiment, star ratings, and feedback per room tier.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 pb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mr-2">Room Type:</span>
        <button
          type="button"
          onClick={() => {
            setSelectedRoomTypeId('all')
            setStarFilter('all')
          }}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            selectedRoomTypeId === 'all'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          All Room Types
        </button>
        {roomTypes.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setSelectedRoomTypeId(t.id)
              setStarFilter('all')
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              selectedRoomTypeId === t.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Average Rating</p>
          <div className="mt-3 flex items-center gap-2 font-display text-5xl font-extrabold text-primary">
            {avgRating > 0 ? avgRating.toFixed(1) : '—'}
            <Star className="h-9 w-9 fill-amber-400 text-amber-400" />
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Based on <strong>{totalReviews}</strong> verified guest review{totalReviews === 1 ? '' : 's'}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm lg:col-span-2 space-y-2.5">
          <h3 className="font-display text-sm font-bold text-primary mb-3">Rating Breakdown</h3>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingCounts[star] || 0
            const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0

            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setStarFilter(starFilter === star ? 'all' : star)}
                  className={`flex items-center gap-1 w-14 font-semibold ${
                    starFilter === star ? 'text-primary font-bold underline' : 'text-neutral-600'
                  }`}
                >
                  <span>{star}</span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                </button>
                <div className="h-2 flex-1 rounded-full bg-neutral-100 overflow-hidden">
                  <div className="h-2 rounded-full bg-amber-400 transition-all" style={{ width: `${percentage}%` }} />
                </div>
                <span className="w-10 text-right text-neutral-400">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-primary">
            Guest Reviews {starFilter !== 'all' && `(${starFilter} Stars)`}
          </h3>
          {starFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setStarFilter('all')}
              className="text-xs font-semibold text-accent hover:underline"
            >
              Clear Star Filter
            </button>
          )}
        </div>

        {isLoading ? (
          <BookingListSkeleton count={3} />
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-2xl border border-neutral-100 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm">
            No guest reviews found for this selection.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredReviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">{r.user?.name ?? 'Verified Guest'}</p>
                      <p className="text-xs text-neutral-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {r.comment ? (
                  <p className="text-xs leading-relaxed text-neutral-600 bg-neutral-50/70 p-3 rounded-xl border border-neutral-100 italic">
                    "{r.comment}"
                  </p>
                ) : (
                  <p className="text-xs text-neutral-400 italic">No written comment provided.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
