import { BedDouble } from 'lucide-react'
import { StatusBadge } from '../StatusBadge'
import type { Booking } from '../../types/api'

function formatMoney(amount: number) {
  return `$${amount.toFixed(2)}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function BookingTableRow({ booking }: { booking: Booking }) {
  const roomLabel = booking.room?.roomNumber ?? booking.roomId.slice(0, 8)
  const typeName = booking.room?.roomType?.name ?? 'Room'

  return (
    <tr className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
            <BedDouble className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">{typeName}</p>
            <p className="text-xs text-neutral-500">Room {roomLabel}</p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 text-sm text-neutral-600 sm:table-cell">
        {booking.guestsCount} guest{booking.guestsCount === 1 ? '' : 's'}
      </td>
      <td className="hidden px-4 py-3 font-mono text-xs text-neutral-500 md:table-cell">
        {booking.id.slice(0, 8)}…
      </td>
      <td className="px-4 py-3 text-sm text-neutral-600">
        {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-primary">{formatMoney(booking.totalPrice)}</td>
      <td className="px-4 py-3">
        <StatusBadge status={booking.status} />
      </td>
    </tr>
  )
}

export function BookingTable({
  bookings,
  emptyMessage,
}: {
  bookings: Booking[]
  emptyMessage: string
}) {
  if (bookings.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">{emptyMessage}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <thead>
          <tr className="border-b border-neutral-100 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <th className="px-4 py-3">Room</th>
            <th className="hidden px-4 py-3 sm:table-cell">Guests</th>
            <th className="hidden px-4 py-3 md:table-cell">Booking ID</th>
            <th className="px-4 py-3">Stay</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <BookingTableRow key={booking.id} booking={booking} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
