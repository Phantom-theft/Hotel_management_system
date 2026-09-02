import type { LucideIcon } from 'lucide-react'
import { BedDouble, ConciergeBell } from 'lucide-react'

export interface StaffDashboardNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const STAFF_DASHBOARD_NAV: StaffDashboardNavItem[] = [
  { to: '/staff', label: 'Desk', icon: ConciergeBell, end: true },
  { to: '/staff/rooms', label: 'Rooms', icon: BedDouble },
]

export function staffDashboardTitleForPath(pathname: string): string {
  if (pathname === '/staff') return 'Desk'
  if (pathname.startsWith('/staff/rooms')) return 'Rooms'
  return 'Dashboard'
}
