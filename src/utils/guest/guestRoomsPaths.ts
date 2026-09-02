export const GUEST_ROOMS_LIST_PATH = '/rooms'

export function guestRoomDetailPath(roomId: string, query = ''): string {
  return `${GUEST_ROOMS_LIST_PATH}/${roomId}${query ? `?${query}` : ''}`
}
