import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BedDouble,
  ConciergeBell,
  LayoutDashboard,
  Users,
} from 'lucide-react'
import type { UserRole } from '../types/api'

export interface DashboardNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export function dashboardNavForRole(role: UserRole | undefined): DashboardNavItem[] {
  switch (role) {
    case 'admin':
      return [
        { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
        { to: '/admin/rooms', label: 'Inventory', icon: BedDouble },
        { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
        { to: '/admin/staff', label: 'Team', icon: Users },
        { to: '/staff', label: 'Desk', icon: ConciergeBell },
      ]
    case 'staff':
      return [
        { to: '/staff', label: 'Desk', icon: ConciergeBell, end: true },
        { to: '/staff/rooms', label: 'Rooms', icon: BedDouble },
      ]
    default:
      return []
  }
}

export function dashboardTitleForPath(pathname: string): string {
  if (pathname === '/staff') return 'Desk'
  if (pathname.startsWith('/staff/rooms')) return 'Rooms'
  if (pathname === '/admin' || pathname === '/admin/') return 'Overview'
  if (pathname.startsWith('/admin/rooms')) return 'Inventory'
  if (pathname.startsWith('/admin/reports')) return 'Reports'
  if (pathname.startsWith('/admin/staff')) return 'Team'
  return 'Dashboard'
}

export function dashboardShowsDateRange(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/reports')
}
