import type { LucideIcon } from 'lucide-react'
import { BedDouble, ConciergeBell, UserRound } from 'lucide-react'

export interface StaffDashboardNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const STAFF_DASHBOARD_NAV: StaffDashboardNavItem[] = [
  { to: '/staff', label: 'Desk', icon: ConciergeBell, end: true },
  { to: '/staff/rooms', label: 'Rooms', icon: BedDouble },
  { to: '/staff/profile', label: 'Profile', icon: UserRound },
]

export function staffDashboardTitleForPath(pathname: string): string {
  if (pathname === '/staff') return 'Desk'
  if (pathname.startsWith('/staff/rooms')) return 'Rooms'
  if (pathname.startsWith('/staff/profile')) return 'Profile'
  if (pathname.startsWith('/staff/book')) return 'Book room'
  return 'Dashboard'
}
