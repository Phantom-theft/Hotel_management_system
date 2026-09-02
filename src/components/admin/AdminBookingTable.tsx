import { BedDouble, Eye } from 'lucide-react'
import { StatusBadge } from '../ui/StatusBadge'
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

export interface AdminBookingTableActions {
  onCheckIn?: (id: string) => void
  onCheckOut?: (id: string) => void
  onSelectBooking?: (booking: Booking) => void
  busyId?: string | null
}

export function AdminBookingTableRow({
  booking,
  actions,
  showGuestColumn = true,
}: {
  booking: Booking
  actions?: AdminBookingTableActions
  showGuestColumn?: boolean
}) {
  const roomLabel = booking.room?.roomNumber ?? booking.roomId.slice(0, 8)
  const typeName = booking.room?.roomType?.name ?? 'Room'
  const guestName = booking.guest?.name ?? '—'
  const guestEmail = booking.guest?.email
  const canCheckIn = booking.status === 'confirmed' && actions?.onCheckIn
  const canCheckOut = booking.status === 'checked_in' && actions?.onCheckOut
  const busy = actions?.busyId === booking.id

  return (
    <tr
      className={`border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80 transition-colors ${
        actions?.onSelectBooking ? 'cursor-pointer' : ''
      }`}
      onClick={() => actions?.onSelectBooking?.(booking)}
    >
      {showGuestColumn && (
        <td className="px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">{guestName}</p>
            {guestEmail && <p className="truncate text-xs text-neutral-500">{guestEmail}</p>}
          </div>
        </td>
      )}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
            <BedDouble className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">{typeName}</p>
            <p className="text-xs text-neutral-500">Room #{roomLabel}</p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 text-sm text-neutral-600 sm:table-cell">
        {booking.guestsCount} guest{booking.guestsCount === 1 ? '' : 's'}
      </td>
      <td className="px-4 py-3 text-sm text-neutral-600">
        {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-primary">{formatMoney(booking.totalPrice)}</td>
      <td className="px-4 py-3">
        <StatusBadge status={booking.status} />
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-2">
          {actions?.onSelectBooking && (
            <button
              type="button"
              onClick={() => actions.onSelectBooking!(booking)}
              className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-primary"
              title="View details"
              aria-label="View booking details"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {canCheckIn && (
            <button
              type="button"
              disabled={busy}
              onClick={() => actions.onCheckIn!(booking.id)}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-light disabled:opacity-60"
            >
              Check in
            </button>
          )}
          {canCheckOut && (
            <button
              type="button"
              disabled={busy}
              onClick={() => actions.onCheckOut!(booking.id)}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-light disabled:opacity-60"
            >
              Check out
            </button>
          )}
          {!canCheckIn && !canCheckOut && !actions?.onSelectBooking && (
            <span className="text-xs text-neutral-400">—</span>
          )}
        </div>
      </td>
    </tr>
  )
}

export function AdminBookingTable({
  bookings,
  emptyMessage,
  actions,
  showGuestColumn = true,
}: {
  bookings: Booking[]
  emptyMessage: string
  actions?: AdminBookingTableActions
  showGuestColumn?: boolean
}) {
  if (bookings.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">{emptyMessage}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className="border-b border-neutral-100 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {showGuestColumn && <th className="px-4 py-3">Guest</th>}
            <th className="px-4 py-3">Room</th>
            <th className="hidden px-4 py-3 sm:table-cell">Guests</th>
            <th className="px-4 py-3">Stay</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <AdminBookingTableRow
              key={booking.id}
              booking={booking}
              actions={actions}
              showGuestColumn={showGuestColumn}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

