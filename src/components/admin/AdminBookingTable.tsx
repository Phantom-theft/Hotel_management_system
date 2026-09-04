import { BedDouble, Eye, MoreHorizontal } from 'lucide-react'
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

function nightsBetween(checkIn: string, checkOut: string) {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  const nights = Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)))
  return nights
}

function guestInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
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
  const nights = nightsBetween(booking.checkIn, booking.checkOut)

  return (
    <tr
      className={`border-b border-neutral-100 last:border-0 transition-colors hover:bg-[#F8F9FC] ${
        actions?.onSelectBooking ? 'cursor-pointer' : ''
      }`}
      onClick={() => actions?.onSelectBooking?.(booking)}
    >
      {showGuestColumn && (
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0F1B3D]/8 text-[11px] font-bold text-[#0F1B3D]">
              {guestInitials(guestName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-900">{guestName}</p>
              {guestEmail && <p className="truncate text-xs text-neutral-400">{guestEmail}</p>}
            </div>
          </div>
        </td>
      )}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <BedDouble className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900">{typeName}</p>
            <p className="text-xs text-neutral-400">#{roomLabel}</p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3.5 text-sm text-neutral-600 sm:table-cell">
        {booking.guestsCount}
      </td>
      <td className="px-4 py-3.5">
        <p className="text-sm text-neutral-700">
          {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
        </p>
        <p className="text-xs text-neutral-400">
          {nights} night{nights === 1 ? '' : 's'}
        </p>
      </td>
      <td className="px-4 py-3.5 text-sm font-semibold text-neutral-900">
        {formatMoney(booking.totalPrice)}
      </td>
      <td className="px-4 py-3.5">
        <StatusBadge status={booking.status} />
      </td>
      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1.5">
          {actions?.onSelectBooking && (
            <button
              type="button"
              onClick={() => actions.onSelectBooking!(booking)}
              className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-[#0F1B3D]"
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
              className="rounded-full bg-[#0F1B3D] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1a2a52] disabled:opacity-60"
            >
              Check in
            </button>
          )}
          {canCheckOut && (
            <button
              type="button"
              disabled={busy}
              onClick={() => actions.onCheckOut!(booking.id)}
              className="rounded-full bg-[#0F1B3D] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1a2a52] disabled:opacity-60"
            >
              Check out
            </button>
          )}
          {!canCheckIn && !canCheckOut && (
            <button
              type="button"
              className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="More actions"
              onClick={() => actions?.onSelectBooking?.(booking)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
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
      <table className="w-full min-w-[760px] text-left">
        <thead>
          <tr className="border-b border-neutral-100 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
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
