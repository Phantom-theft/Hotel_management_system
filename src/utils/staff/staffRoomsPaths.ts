export const STAFF_ROOMS_LIST_PATH = '/staff/rooms'
export const STAFF_BOOK_PATH = '/staff/book'

export function staffRoomDetailPath(roomId: string, query = ''): string {
  return `${STAFF_ROOMS_LIST_PATH}/${roomId}${query ? `?${query}` : ''}`
}

export function staffBookPath(query: {
  roomId: string
  checkIn: string
  checkOut: string
  guests: number
}): string {
  const params = new URLSearchParams({
    roomId: query.roomId,
    checkIn: query.checkIn,
    checkOut: query.checkOut,
    guests: String(query.guests),
  })
  return `${STAFF_BOOK_PATH}?${params.toString()}`
}
