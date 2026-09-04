import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, BedDouble, Eye, MoreHorizontal } from 'lucide-react'
import { StatusBadge } from '../ui/StatusBadge'
import type { Booking } from '../../types/api'
import {
  nightsBetween,
  sortBookings,
  type BookingSortKey,
  type SortDirection,
} from '../../utils/bookingTableSort'
import { cn } from '../../lib/utils'

function formatMoney(amount: number) {
  return `$${amount.toFixed(2)}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
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

function SortableTh({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className,
}: {
  label: string
  sortKey: BookingSortKey
  activeKey: BookingSortKey | null
  direction: SortDirection
  onSort: (key: BookingSortKey) => void
  className?: string
}) {
  const active = activeKey === sortKey
  const Icon = !active ? ArrowUpDown : direction === 'asc' ? ArrowUp : ArrowDown

  return (
    <th className={cn('px-4 py-3', className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 uppercase tracking-wider transition hover:text-neutral-700',
          active ? 'font-semibold text-[#0F1B3D]' : 'font-medium text-neutral-400',
        )}
        aria-label={`Sort by ${label}`}
        aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        {label}
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
      </button>
    </th>
  )
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
      <td className="hidden px-4 py-3.5 text-sm tabular-nums text-neutral-600 sm:table-cell">
        {nights} night{nights === 1 ? '' : 's'}
      </td>
      <td className="px-4 py-3.5 text-sm text-neutral-700">{formatDate(booking.checkIn)}</td>
      <td className="px-4 py-3.5 text-sm text-neutral-700">{formatDate(booking.checkOut)}</td>
      <td className="hidden px-4 py-3.5 text-sm font-semibold text-neutral-900 md:table-cell">
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
  const [sortKey, setSortKey] = useState<BookingSortKey | null>('checkIn')
  const [direction, setDirection] = useState<SortDirection>('asc')

  function handleSort(key: BookingSortKey) {
    if (sortKey === key) {
      setDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setDirection(key === 'checkIn' || key === 'checkOut' || key === 'duration' ? 'asc' : 'asc')
  }

  const sorted = useMemo(() => {
    if (!sortKey) return bookings
    return sortBookings(bookings, sortKey, direction)
  }, [bookings, sortKey, direction])

  if (bookings.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">{emptyMessage}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-left">
        <thead>
          <tr className="border-b border-neutral-100 text-[11px]">
            {showGuestColumn && (
              <SortableTh
                label="Guest Name"
                sortKey="guestName"
                activeKey={sortKey}
                direction={direction}
                onSort={handleSort}
              />
            )}
            <SortableTh
              label="Room Type"
              sortKey="roomType"
              activeKey={sortKey}
              direction={direction}
              onSort={handleSort}
            />
            <SortableTh
              label="Duration"
              sortKey="duration"
              activeKey={sortKey}
              direction={direction}
              onSort={handleSort}
              className="hidden sm:table-cell"
            />
            <SortableTh
              label="Check-In"
              sortKey="checkIn"
              activeKey={sortKey}
              direction={direction}
              onSort={handleSort}
            />
            <SortableTh
              label="Check-Out"
              sortKey="checkOut"
              activeKey={sortKey}
              direction={direction}
              onSort={handleSort}
            />
            <th className="hidden px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-neutral-400 md:table-cell">
              Amount
            </th>
            <SortableTh
              label="Status"
              sortKey="status"
              activeKey={sortKey}
              direction={direction}
              onSort={handleSort}
            />
            <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((booking) => (
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
