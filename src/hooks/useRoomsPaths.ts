import { useLocation } from 'react-router-dom'
import { roomDetailPath, roomsListPath } from '../utils/roomsPaths'

export function useRoomsPaths() {
  const { pathname } = useLocation()
  const listPath = roomsListPath(pathname)

  return {
    listPath,
    isDashboardRooms: listPath === '/staff/rooms',
    detailPath: (roomId: string, query = '') => roomDetailPath(pathname, roomId, query),
  }
}
