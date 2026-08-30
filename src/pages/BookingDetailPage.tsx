import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMyBookings } from '../api/hotel'
import { BookingListSkeleton } from '../components/Skeletons'
import { StatusBadge } from '../components/StatusBadge'
import { useAuthStore } from '../store/authStore'
import { formatMoney, formatStay, nightsBetween } from '../utils/bookingFormat'

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const userId = useAuthStore((s) => s.user?.id)

  const query = useQuery({
    queryKey: ['my-bookings', userId],
    queryFn: getMyBookings,
    enabled: !!userId,
  })

  const booking = query.data?.bookings.find((b) => b.id === id)

  if (query.isLoading) return <BookingListSkeleton count={2} />

  if (!booking) {
    return (
      <div className="space-y-3">
        <p className="text-neutral-700">Booking not found.</p>
        <Link to="/my-bookings" className="text-accent hover:underline">
          ← Back to my bookings
        </Link>
      </div>
    )
  }

  const nights = nightsBetween(booking.checkIn.slice(0, 10), booking.checkOut.slice(0, 10))
  const roomType = booking.room?.roomType

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/my-bookings" className="text-sm text-accent hover:underline">
        ← My bookings
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-extrabold text-primary">Booking invoice</h1>
        <StatusBadge status={booking.status} />
      </div>

      <section className="rounded-xl border border-neutral-100 bg-white p-6 shadow-card">
        <h2 className="font-display text-xl">Harborlight Hotel</h2>
        <p className="mt-1 text-sm text-neutral-500">Reservation receipt</p>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-500">Booking ID</dt>
            <dd className="font-mono text-neutral-900">{booking.id}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Created</dt>
            <dd>{new Date(booking.createdAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Room</dt>
            <dd>
              {roomType?.name ?? 'Room'} · #{booking.room?.roomNumber ?? '—'} · Floor{' '}
              {booking.room?.floor ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Guests</dt>
            <dd>{booking.guestsCount}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-neutral-500">Stay</dt>
            <dd>{formatStay(booking.checkIn, booking.checkOut)}</dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-neutral-100 pt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="py-1 font-medium">Description</th>
                <th className="py-1 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-neutral-100">
                <td className="py-2">
                  {roomType?.name ?? 'Room'} × {nights} night{nights === 1 ? '' : 's'}
                  {roomType ? ` @ ${formatMoney(roomType.basePrice)}` : ''}
                </td>
                <td className="py-2 text-right">{formatMoney(booking.totalPrice)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t border-neutral-200">
                <td className="py-3 font-semibold text-neutral-900">Total</td>
                <td className="py-3 text-right text-lg font-semibold text-accent">
                  {formatMoney(booking.totalPrice)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {booking.status === 'pending' && booking.expiresAt && (
          <p className="mt-4 rounded-xl border border-warning/20 bg-warning/10 px-3 py-2 text-sm text-warning">
            Payment hold expires {new Date(booking.expiresAt).toLocaleString()}. Complete payment
            from the booking flow if you still intend to stay.
          </p>
        )}
      </section>
    </div>
  )
}
