/** Rooms list/detail paths — staff uses dashboard routes; customers use public /rooms. */
export function roomsListPath(pathname: string): string {
  if (pathname.startsWith('/staff/rooms') || pathname === '/staff/rooms') {
    return '/staff/rooms'
  }
  return '/rooms'
}

export function roomDetailPath(pathname: string, roomId: string, query = ''): string {
  const base = roomsListPath(pathname)
  return `${base}/${roomId}${query ? `?${query}` : ''}`
}
