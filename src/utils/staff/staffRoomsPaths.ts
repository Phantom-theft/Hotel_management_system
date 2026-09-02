export const STAFF_ROOMS_LIST_PATH = '/staff/rooms'

export function staffRoomDetailPath(roomId: string, query = ''): string {
  return `${STAFF_ROOMS_LIST_PATH}/${roomId}${query ? `?${query}` : ''}`
}
