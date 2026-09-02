import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchRooms } from '../../api/hotel'

export function useGuestRoomSearch(filters: {
  checkIn: string
  checkOut: string
  guests: number
  type?: string
  enabled?: boolean
}) {
  const enabled =
    filters.enabled !== false &&
    !!filters.checkIn &&
    !!filters.checkOut &&
    filters.checkOut > filters.checkIn

  const query = useQuery({
    queryKey: ['rooms', filters.checkIn, filters.checkOut, filters.guests, filters.type ?? 'all'],
    enabled,
    queryFn: () =>
      searchRooms({
        checkIn: filters.checkIn,
        checkOut: filters.checkOut,
        guests: filters.guests,
        type: filters.type || undefined,
      }),
  })

  const roomTypes = useMemo(() => {
    const map = new Map<string, string>()
    for (const room of query.data?.rooms ?? []) {
      if (room.roomType) {
        map.set(room.roomType.id, room.roomType.name)
      }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [query.data?.rooms])

  return { ...query, roomTypes }
}
