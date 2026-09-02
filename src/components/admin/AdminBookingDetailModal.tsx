import { useRef } from 'react'
import {
  BedDouble,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Mail,
  Printer,
  User as UserIcon,
  X,
} from 'lucide-react'
import { StatusBadge } from '../ui/StatusBadge'
import type { Booking } from '../../types/api'

interface AdminBookingDetailModalProps {
  booking: Booking | null
  onClose: () => void
  onCheckIn?: (id: string) => void
  onCheckOut?: (id: string) => void
  onCancel?: (id: string) => void
  busyId?: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn).getTime()
  const end = new Date(checkOut).getTime()
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays)
}

export function AdminBookingDetailModal({
  booking,
  onClose,
  onCheckIn,
  onCheckOut,
  onCancel,
  busyId,
}: AdminBookingDetailModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!booking) return null

  const roomLabel = booking.room?.roomNumber ?? booking.roomId.slice(0, 8)
  const roomTypeName = booking.room?.roomType?.name ?? 'Standard Room'
  const guestName = booking.guest?.name ?? 'Guest'
  const guestEmail = booking.guest?.email ?? '—'
  const nights = calculateNights(booking.checkIn, booking.checkOut)
  const nightlyAvg = booking.totalPrice / nights
  const busy = busyId === booking.id

  function handlePrint() {
    window.print()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={printRef}
        className="w-full max-w-2xl rounded-2xl border border-neutral-100 bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-neutral-100 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-xl font-bold text-primary">Booking Folio</h2>
              <StatusBadge status={booking.status} />
            </div>
            <p className="mt-1 font-mono text-xs text-neutral-400">ID: {booking.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 print:hidden"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 print:hidden"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="mt-5 space-y-5">
          {/* Guest & Room Details Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <UserIcon className="h-4 w-4 text-primary" />
                Guest Details
              </div>
              <p className="mt-2 text-base font-bold text-primary">{guestName}</p>
              <p className="flex items-center gap-1.5 text-xs text-neutral-600">
                <Mail className="h-3.5 w-3.5 text-neutral-400" />
                {guestEmail}
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                Party size:{' '}
                <span className="font-medium text-neutral-700">
                  {booking.guestsCount} guest{booking.guestsCount === 1 ? '' : 's'}
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <BedDouble className="h-4 w-4 text-primary" />
                Room Details
              </div>
              <p className="mt-2 text-base font-bold text-primary">{roomTypeName}</p>
              <p className="text-xs text-neutral-600">
                Room Number: <span className="font-semibold text-primary">#{roomLabel}</span>
              </p>
              {booking.room?.floor && (
                <p className="mt-0.5 text-xs text-neutral-500">Floor {booking.room.floor}</p>
              )}
            </div>
          </div>

          {/* Stay Timeline */}
          <div className="rounded-xl border border-neutral-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <Calendar className="h-4 w-4 text-primary" />
              Reservation Schedule
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-neutral-400">Check-in</p>
                <p className="text-sm font-semibold text-primary">{formatDate(booking.checkIn)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Check-out</p>
                <p className="text-sm font-semibold text-primary">{formatDate(booking.checkOut)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Duration</p>
                <p className="text-sm font-semibold text-primary">
                  {nights} night{nights === 1 ? '' : 's'}
                </p>
              </div>
            </div>
          </div>

          {/* Financials & Folio Summary */}
          <div className="rounded-xl border border-neutral-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <DollarSign className="h-4 w-4 text-primary" />
              Charges & Billing
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>
                  Room Rate ({nights} night{nights === 1 ? '' : 's'} × ${nightlyAvg.toFixed(2)})
                </span>
                <span className="font-medium text-neutral-800">${booking.totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-100 pt-2 font-display text-base font-bold text-primary">
                <span>Total Amount</span>
                <span>${booking.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4 print:hidden">
          <div>
            {booking.status !== 'cancelled' && booking.status !== 'checked_out' && onCancel && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onCancel(booking.id)}
                className="text-xs font-semibold text-danger hover:underline disabled:opacity-50"
              >
                Cancel reservation
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              Close
            </button>
            {booking.status === 'confirmed' && onCheckIn && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onCheckIn(booking.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-light disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Check in Guest
              </button>
            )}
            {booking.status === 'checked_in' && onCheckOut && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onCheckOut(booking.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-light disabled:opacity-50"
              >
                <Clock className="h-4 w-4" />
                Check out Guest
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
