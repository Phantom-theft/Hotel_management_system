import { Link, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { adminDashboardTitleForPath } from '../../constants/admin/dashboardNav'
import { useAdminDashboardShell } from '../../contexts/admin/AdminDashboardShellContext'
import { useAuthStore } from '../../store/authStore'
import { AdminDateRangePicker } from './AdminDateRangePicker'

function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function AdminDashboardTopBar() {
  const { pathname } = useLocation()
  const { setSidebarOpen } = useAdminDashboardShell()
  const user = useAuthStore((s) => s.user)
  const title = adminDashboardTitleForPath(pathname)
  const isOverview = pathname === '/admin' || pathname === '/admin/'

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Admin'
  const greeting = greetingForHour(new Date().getHours())

  if (isOverview) {
    return (
      <header className="admin-print-hide sticky top-0 z-30 border-b border-neutral-200/60 bg-[#F5F6FA]/95 backdrop-blur-md">
        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                className="mt-0.5 rounded-lg p-2 text-neutral-600 transition hover:bg-white lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.75rem]">
                  {greeting}, {firstName} 👋
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                  Here&apos;s what&apos;s happening at Harborlight Hotel today.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pl-11 xl:pl-0">
              <div className="inline-flex flex-wrap items-center gap-1.5">
                <Link
                  to="/admin/bookings"
                  className="inline-flex items-center rounded-full bg-[#0F1B3D] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1a2a52]"
                >
                  Walk-in
                </Link>
                <HeaderNavLink to="/admin/rooms" label="Rooms" />
                <HeaderNavLink to="/admin/promotions" label="Promotions" />
                <HeaderNavLink to="/admin/reviews" label="Reviews" />
              </div>

              <AdminDateRangePicker />
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="admin-print-hide sticky top-0 z-30 border-b border-neutral-200/60 bg-[#F5F6FA]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-neutral-600 transition hover:bg-white lg:hidden"
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

function HeaderNavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-600 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
    >
      {label}
    </Link>
  )
}
