import { describe, expect, it } from 'vitest'
import type { Booking } from '../types/api'
import {
  matchesBookingSearch,
  nightsBetween,
  sortBookings,
} from './bookingTableSort'
import { searchAdminEntities } from './adminGlobalSearch'

function booking(partial: Partial<Booking> & Pick<Booking, 'id'>): Booking {
  return {
    userId: 'u1',
    roomId: 'r1',
    checkIn: '2026-03-01T00:00:00.000Z',
    checkOut: '2026-03-03T00:00:00.000Z',
    status: 'confirmed',
    totalPrice: 200,
    guestsCount: 2,
    expiresAt: null,
    createdAt: '2026-02-01T00:00:00.000Z',
    guest: { name: 'Ada Lovelace', email: 'ada@example.com' },
    room: {
      id: 'r1',
      roomTypeId: 'rt1',
      roomNumber: '101',
      floor: 1,
      status: 'available',
      roomType: {
        id: 'rt1',
        name: 'Standard',
        description: null,
        basePrice: 100,
        capacity: 2,
        amenities: [],
        images: [],
      },
    },
    ...partial,
  }
}

describe('sortBookings', () => {
  const rows = [
    booking({
      id: 'b1',
      guest: { name: 'Zoe', email: 'z@x.com' },
      checkIn: '2026-03-10T00:00:00.000Z',
      checkOut: '2026-03-12T00:00:00.000Z',
      status: 'checked_out',
      room: {
        id: 'r2',
        roomTypeId: 'rt2',
        roomNumber: '202',
        floor: 2,
        status: 'occupied',
        roomType: {
          id: 'rt2',
          name: 'Suite',
          description: null,
          basePrice: 250,
          capacity: 4,
          amenities: [],
          images: [],
        },
      },
    }),
    booking({
      id: 'b2',
      guest: { name: 'Ada', email: 'a@x.com' },
      checkIn: '2026-03-01T00:00:00.000Z',
      checkOut: '2026-03-05T00:00:00.000Z',
      status: 'confirmed',
    }),
    booking({
      id: 'b3',
      guest: { name: 'Mia', email: 'm@x.com' },
      checkIn: '2026-03-05T00:00:00.000Z',
      checkOut: '2026-03-06T00:00:00.000Z',
      status: 'pending',
      room: {
        id: 'r3',
        roomTypeId: 'rt3',
        roomNumber: '301',
        floor: 3,
        status: 'available',
        roomType: {
          id: 'rt3',
          name: 'Deluxe',
          description: null,
          basePrice: 180,
          capacity: 3,
          amenities: [],
          images: [],
        },
      },
    }),
  ]

  it('sorts guest names ascending and descending', () => {
    expect(sortBookings(rows, 'guestName', 'asc').map((b) => b.guest?.name)).toEqual([
      'Ada',
      'Mia',
      'Zoe',
    ])
    expect(sortBookings(rows, 'guestName', 'desc').map((b) => b.guest?.name)).toEqual([
      'Zoe',
      'Mia',
      'Ada',
    ])
  })

  it('sorts room type, duration, check-in, check-out, and status', () => {
    expect(sortBookings(rows, 'roomType', 'asc').map((b) => b.room?.roomType?.name)).toEqual([
      'Deluxe',
      'Standard',
      'Suite',
    ])
    expect(sortBookings(rows, 'duration', 'asc').map((b) => nightsBetween(b.checkIn, b.checkOut))).toEqual([
      1, 2, 4,
    ])
    expect(sortBookings(rows, 'checkIn', 'asc').map((b) => b.id)).toEqual(['b2', 'b3', 'b1'])
    expect(sortBookings(rows, 'checkOut', 'desc').map((b) => b.id)).toEqual(['b1', 'b3', 'b2'])
    expect(sortBookings(rows, 'status', 'asc').map((b) => b.status)).toEqual([
      'pending',
      'confirmed',
      'checked_out',
    ])
  })
})

describe('matchesBookingSearch / searchAdminEntities', () => {
  const bookings = [
    booking({ id: 'b1' }),
    booking({
      id: 'b2',
      guest: { name: 'Grace Hopper', email: 'grace@navy.gov' },
      room: {
        id: 'r9',
        roomTypeId: 'rt2',
        roomNumber: '505',
        floor: 5,
        status: 'occupied',
        roomType: {
          id: 'rt2',
          name: 'Suite',
          description: null,
          basePrice: 250,
          capacity: 4,
          amenities: [],
          images: [],
        },
      },
    }),
  ]
  const rooms = [
    bookings[0].room!,
    bookings[1].room!,
    {
      id: 'r-maint',
      roomTypeId: 'rt1',
      roomNumber: '110',
      floor: 1,
      status: 'maintenance' as const,
      roomType: bookings[0].room!.roomType,
    },
  ]

  it('matches bookings by guest, room number, and room type', () => {
    expect(matchesBookingSearch(bookings[0], 'ada')).toBe(true)
    expect(matchesBookingSearch(bookings[1], 'suite')).toBe(true)
    expect(matchesBookingSearch(bookings[1], '505')).toBe(true)
    expect(matchesBookingSearch(bookings[0], 'zzz')).toBe(false)
  })

  it('returns booking, room, and guest hits from global search', () => {
    const byGuest = searchAdminEntities('grace', bookings, rooms)
    expect(byGuest.some((h) => h.kind === 'booking')).toBe(true)
    expect(byGuest.some((h) => h.kind === 'guest' && h.label.includes('Grace'))).toBe(true)

    const byRoom = searchAdminEntities('maintenance', bookings, rooms)
    expect(byRoom.some((h) => h.kind === 'room' && h.label.includes('110'))).toBe(true)

    const byType = searchAdminEntities('suite', bookings, rooms)
    expect(byType.some((h) => h.kind === 'booking')).toBe(true)
    expect(byType.some((h) => h.kind === 'room')).toBe(true)
  })
})
