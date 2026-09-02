import { useQuery } from '@tanstack/react-query'
import { searchRooms } from '../../api/hotel'
import type { Room } from '../../types/api'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toYmd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function addDays(d: Date, days: number) {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

/** Marks a date booked if a 1-night search starting that day does not include the room. */
export function useGuestRoomAvailability(roomId: string | undefined, month: Date) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const days = new Date(year, monthIndex + 1, 0).getDate()

  return useQuery({
    queryKey: ['room-availability', roomId, year, monthIndex],
    enabled: !!roomId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!roomId) return [] as string[]

      const checks = Array.from({ length: days }, (_, i) => {
        const day = i + 1
        const checkIn = new Date(year, monthIndex, day)
        const checkOut = addDays(checkIn, 1)
        return { key: toYmd(checkIn), checkIn: toYmd(checkIn), checkOut: toYmd(checkOut) }
      })

      const results = await Promise.all(
        checks.map(async (c) => {
          try {
            const { rooms } = await searchRooms({
              checkIn: c.checkIn,
              checkOut: c.checkOut,
              guests: 1,
            })
            const available = rooms.some((r: Room) => r.id === roomId)
            return available ? null : c.key
          } catch {
            return null
          }
        }),
      )

      return results.filter((x): x is string => x != null)
    },
  })
}
