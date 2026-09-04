import type { Booking, BookingStatus } from '../types/api'

export type BookingSortKey =
  | 'guestName'
  | 'roomType'
  | 'duration'
  | 'checkIn'
  | 'checkOut'
  | 'status'

export type SortDirection = 'asc' | 'desc'

const STATUS_ORDER: BookingStatus[] = [
  'pending',
  'confirmed',
  'checked_in',
  'checked_out',
  'cancelled',
]

export function nightsBetween(checkIn: string, checkOut: string) {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)))
}

function compareStrings(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true })
}

function sortValue(booking: Booking, key: BookingSortKey): string | number {
  switch (key) {
    case 'guestName':
      return booking.guest?.name?.trim() || ''
    case 'roomType':
      return booking.room?.roomType?.name?.trim() || ''
    case 'duration':
      return nightsBetween(booking.checkIn, booking.checkOut)
    case 'checkIn':
      return new Date(booking.checkIn).getTime()
    case 'checkOut':
      return new Date(booking.checkOut).getTime()
    case 'status':
      return STATUS_ORDER.indexOf(booking.status)
    default:
      return ''
  }
}

export function sortBookings(
  bookings: Booking[],
  key: BookingSortKey,
  direction: SortDirection,
): Booking[] {
  const dir = direction === 'asc' ? 1 : -1
  return [...bookings].sort((a, b) => {
    const av = sortValue(a, key)
    const bv = sortValue(b, key)
    let cmp = 0
    if (typeof av === 'number' && typeof bv === 'number') {
      cmp = av - bv
    } else {
      cmp = compareStrings(String(av), String(bv))
    }
    if (cmp !== 0) return cmp * dir
    return compareStrings(a.id, b.id)
  })
}

export function matchesBookingSearch(booking: Booking, query: string): boolean {
  const q = query.toLowerCase().trim()
  if (!q) return true
  const guestName = booking.guest?.name?.toLowerCase() ?? ''
  const guestEmail = booking.guest?.email?.toLowerCase() ?? ''
  const roomNum = booking.room?.roomNumber?.toLowerCase() ?? ''
  const roomType = booking.room?.roomType?.name?.toLowerCase() ?? ''
  const bookingId = booking.id.toLowerCase()
  return (
    guestName.includes(q) ||
    guestEmail.includes(q) ||
    roomNum.includes(q) ||
    roomType.includes(q) ||
    bookingId.includes(q)
  )
}
