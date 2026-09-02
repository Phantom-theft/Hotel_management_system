import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BedDouble,
  CalendarDays,
  LayoutDashboard,
  Percent,
  Star,
  Users,
} from 'lucide-react'

export interface AdminDashboardNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const ADMIN_DASHBOARD_NAV: AdminDashboardNavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/rooms', label: 'Rooms', icon: BedDouble },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/admin/promotions', label: 'Promotions', icon: Percent },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/staff', label: 'Staff', icon: Users },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
]

export function adminDashboardTitleForPath(pathname: string): string | null {
  if (pathname === '/admin' || pathname === '/admin/') return null
  if (pathname.startsWith('/admin/rooms')) return 'Rooms'
  if (pathname.startsWith('/admin/bookings')) return 'Bookings'
  if (pathname.startsWith('/admin/promotions')) return 'Promotions'
  if (pathname.startsWith('/admin/reviews')) return 'Guest Reviews'
  if (pathname.startsWith('/admin/staff')) return 'Staff'
  if (pathname.startsWith('/admin/reports')) return 'Reports'
  return 'Dashboard'
}

