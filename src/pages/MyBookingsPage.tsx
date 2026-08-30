import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cancelBooking, getMyBookings } from '../api/hotel'
import { EmptyState } from '../components/EmptyState'
import { BookingListSkeleton } from '../components/Skeletons'
import { Modal } from '../components/Modal'
import { ReviewForm } from '../components/ReviewForm'
import { StatusBadge } from '../components/StatusBadge'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import { formatMoney, formatStay } from '../utils/bookingFormat'
import type { Booking } from '../types/api'

function isUpcoming(b: Booking) {
  return (
    (b.status === 'pending' || b.status === 'confirmed' || b.status === 'checked_in') &&
    new Date(b.checkOut) >= new Date()
  )
}

function canCancel(b: Booking) {
  return b.status === 'pending' || b.status === 'confirmed'
}

function isReviewEligible(b: Booking) {
  return b.status === 'checked_out'
}

export function MyBookingsPage() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [reviewDismissed, setReviewDismissed] = useState<Set<string>>(new Set())

  const query = useQuery({
    queryKey: ['my-bookings', userId],
    queryFn: getMyBookings,
    enabled: !!userId,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelBooking(id),
    onSuccess: () => {
      toast('Booking cancelled', 'success')
      setCancelTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['my-bookings', userId] })
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not cancel booking'
      toast(message, 'error')
    },
  })

  const { upcoming, past, reviewable } = useMemo(() => {
    const bookings = query.data?.bookings ?? []
    const checkedOut = bookings.filter(isReviewEligible)
    const seenRoomTypes = new Set<string>()
    const uniqueReviewable = checkedOut.filter((b) => {
      const rtId = b.room?.roomTypeId
      if (!rtId || seenRoomTypes.has(rtId) || reviewDismissed.has(rtId)) return false
      seenRoomTypes.add(rtId)
      return true
    })
    return {
      upcoming: bookings.filter(isUpcoming),
      past: bookings.filter((b) => !isUpcoming(b)),
      reviewable: uniqueReviewable,
    }
  }, [query.data?.bookings, reviewDismissed])

  const hasAny = (query.data?.bookings.length ?? 0) > 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-primary">My bookings</h1>
        <p className="mt-1 text-neutral-600">Upcoming stays, past trips, and reviews.</p>
      </div>

      {query.isLoading && <BookingListSkeleton />}

      {query.isError && (
        <p
          className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger"
          role="alert"
        >
          Failed to load bookings.
        </p>
      )}

      {query.data && !hasAny && (
        <EmptyState
          title="No bookings yet"
          description="When you reserve a room, your upcoming and past stays will appear here."
          actionLabel="Browse rooms"
          actionTo="/rooms"
          icon={<span className="text-4xl" aria-hidden>🏨</span>}
        />
      )}

      {query.data && hasAny && (
        <>
          {reviewable.length > 0 && userId && (
            <section className="space-y-3">
              <h2 className="font-display text-xl">Leave a review</h2>
              <p className="text-sm text-neutral-600">
                Share feedback on room types you&apos;ve completed stays in.
              </p>
              {reviewable.map((b) => (
                <article
                  key={b.id}
                  className="rounded-xl border border-neutral-100 bg-white p-4 shadow-card"
                >
                  <p className="text-sm text-neutral-600">
                    {b.room?.roomType?.name ?? 'Room'} · {formatStay(b.checkIn, b.checkOut)}
                  </p>
                  <ReviewForm
                    booking={b}
                    userId={userId}
                    onSubmitted={() => {
                      if (b.room?.roomTypeId) {
                        setReviewDismissed((prev) => new Set(prev).add(b.room!.roomTypeId))
                      }
                    }}
                  />
                </article>
              ))}
            </section>
          )}

          <section className="space-y-3">
            <h2 className="font-display text-xl">Upcoming</h2>
            {upcoming.length === 0 ? (
              <EmptyState
                title="No upcoming stays"
                description="Search available rooms and book your next visit to Harborlight."
                actionLabel="Find a room"
                actionTo="/rooms"
              />
            ) : (
              upcoming.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  onCancel={canCancel(b) ? () => setCancelTarget(b) : undefined}
                />
              ))
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl">Past</h2>
            {past.length === 0 ? (
              <p className="text-sm text-neutral-500">Completed and cancelled stays appear here.</p>
            ) : (
              past.map((b) => <BookingRow key={b.id} booking={b} />)
            )}
          </section>
        </>
      )}

      <Modal
        open={!!cancelTarget}
        title="Cancel booking?"
        danger
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        confirming={cancelMutation.isPending}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) cancelMutation.mutate(cancelTarget.id)
        }}
      >
        {cancelTarget && (
          <p>
            Cancel stay for {cancelTarget.room?.roomType?.name ?? 'room'} (
            {formatStay(cancelTarget.checkIn, cancelTarget.checkOut)})? This cannot be undone.
          </p>
        )}
      </Modal>
    </div>
  )
}

function BookingRow({
  booking,
  onCancel,
}: {
  booking: Booking
  onCancel?: () => void
}) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-neutral-100 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium text-neutral-900">
            {booking.room?.roomType?.name ?? 'Room'} · #{booking.room?.roomNumber ?? '—'}
          </h3>
          <StatusBadge status={booking.status} />
        </div>
        <p className="text-sm text-neutral-600">{formatStay(booking.checkIn, booking.checkOut)}</p>
        <p className="text-sm text-accent">{formatMoney(booking.totalPrice)}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          to={`/my-bookings/${booking.id}`}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Details / invoice
        </Link>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-danger/20 px-3 py-1.5 text-sm text-danger hover:bg-danger/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          >
            Cancel
          </button>
        )}
      </div>
    </article>
  )
}
