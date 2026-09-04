import type { Booking, Room } from '../types/api'
import { matchesBookingSearch } from './bookingTableSort'

export type AdminSearchHitKind = 'booking' | 'room' | 'guest'

export interface AdminSearchHit {
  kind: AdminSearchHitKind
  id: string
  label: string
  sublabel: string
  to: string
}

export function searchAdminEntities(
  query: string,
  bookings: Booking[],
  rooms: Room[],
  limit = 8,
): AdminSearchHit[] {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const hits: AdminSearchHit[] = []

  for (const booking of bookings) {
    if (!matchesBookingSearch(booking, q)) continue
    const guest = booking.guest?.name ?? 'Guest'
    const room = booking.room?.roomNumber ?? booking.roomId.slice(0, 8)
    hits.push({
      kind: 'booking',
      id: `booking-${booking.id}`,
      label: guest,
      sublabel: `Booking · Room #${room} · ${booking.status.replace('_', ' ')}`,
      to: '/admin/bookings',
    })
    if (hits.filter((h) => h.kind === 'booking').length >= limit) break
  }

  for (const room of rooms) {
    const number = room.roomNumber?.toLowerCase() ?? ''
    const typeName = room.roomType?.name?.toLowerCase() ?? ''
    const status = room.status?.toLowerCase() ?? ''
    if (!number.includes(q) && !typeName.includes(q) && !status.includes(q)) continue
    hits.push({
      kind: 'room',
      id: `room-${room.id}`,
      label: `Room #${room.roomNumber}`,
      sublabel: `${room.roomType?.name ?? 'Room'} · ${room.status}`,
      to: '/admin/rooms',
    })
    if (hits.filter((h) => h.kind === 'room').length >= limit) break
  }

  const seenGuests = new Set<string>()
  for (const booking of bookings) {
    const name = booking.guest?.name?.trim()
    const email = booking.guest?.email?.trim()
    if (!name && !email) continue
    const key = (email || name || '').toLowerCase()
    if (seenGuests.has(key)) continue
    const nameMatch = name?.toLowerCase().includes(q)
    const emailMatch = email?.toLowerCase().includes(q)
    if (!nameMatch && !emailMatch) continue
    seenGuests.add(key)
    hits.push({
      kind: 'guest',
      id: `guest-${key}`,
      label: name || email || 'Guest',
      sublabel: email ? `Guest · ${email}` : 'Guest',
      to: '/admin/bookings',
    })
    if (hits.filter((h) => h.kind === 'guest').length >= limit) break
  }

  return hits.slice(0, limit * 3)
}
