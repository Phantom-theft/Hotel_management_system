import { Link, useLocation } from 'react-router-dom'
import {
  Activity,
  BedDouble,
  LayoutDashboard,
  Menu,
  Percent,
  Star,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { adminDashboardTitleForPath } from '../../constants/admin/dashboardNav'
import { useAdminDashboardShell } from '../../contexts/admin/AdminDashboardShellContext'
import { AdminDateRangePicker } from './AdminDateRangePicker'

export function AdminDashboardTopBar() {
  const { pathname } = useLocation()
  const { setSidebarOpen } = useAdminDashboardShell()
  const title = adminDashboardTitleForPath(pathname)
  const isOverview = pathname === '/admin' || pathname === '/admin/'

  if (isOverview) {
    return (
      <header className="admin-print-hide sticky top-0 z-30 border-b border-neutral-200/70 bg-[#fafaf9]/95 backdrop-blur-md">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                className="mt-0.5 rounded-lg p-2 text-neutral-600 transition hover:bg-neutral-100 lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm sm:flex">
                  <LayoutDashboard className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-xl font-semibold tracking-tight text-neutral-900">Overview</h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      <Activity className="h-3 w-3" aria-hidden />
                      Live
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-neutral-400">Operations and revenue at a glance</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pl-11 lg:pl-0">
              <div className="inline-flex items-center gap-0.5 rounded-full border border-neutral-200/80 bg-white p-1 shadow-sm">
                <Link
                  to="/admin/bookings"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-primary-light"
                >
                  <UserPlus className="h-3.5 w-3.5" aria-hidden />
                  Walk-in
                </Link>
                <HeaderNavLink to="/admin/rooms" icon={BedDouble} label="Rooms" iconClass="text-blue-500" />
                <HeaderNavLink to="/admin/promotions" icon={Percent} label="Promotions" iconClass="text-violet-500" />
                <HeaderNavLink to="/admin/reviews" icon={Star} label="Reviews" iconClass="text-amber-500" />
              </div>

              <AdminDateRangePicker />
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="admin-print-hide sticky top-0 z-30 border-b border-neutral-200/60 bg-[#fafaf9]/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-neutral-600 transition hover:bg-neutral-100 lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && (
          <h1 className="text-lg font-semibold tracking-tight text-neutral-900">{title}</h1>
        )}
      </div>
    </header>
  )
}

function HeaderNavLink({
  to,
  icon: Icon,
  label,
  iconClass = 'text-neutral-400',
}: {
  to: string
  icon: LucideIcon
  label: string
  iconClass?: string
}) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
    >
      <Icon className={`h-3.5 w-3.5 shrink-0 ${iconClass}`} aria-hidden />
      <span>{label}</span>
    </Link>
  )
}
