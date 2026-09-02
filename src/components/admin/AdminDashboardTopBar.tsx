import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import {
  adminDashboardShowsDateRange,
  adminDashboardTitleForPath,
} from '../../constants/admin/dashboardNav'
import { useAdminDashboardShell } from '../../contexts/admin/AdminDashboardShellContext'

export function AdminDashboardTopBar() {
  const { pathname } = useLocation()
  const { dateRange, setDateRange, setSidebarOpen } = useAdminDashboardShell()
  const title = adminDashboardTitleForPath(pathname)
  const showDateRange = adminDashboardShowsDateRange(pathname)

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-100 bg-neutral-50/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-neutral-200 bg-white p-2 text-primary shadow-sm lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary">{title}</h1>
        </div>

        {showDateRange && (
          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm">
            <label className="text-xs">
              <span className="mb-0.5 block text-neutral-500">From</span>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="rounded border border-neutral-200 px-2 py-1 text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="mb-0.5 block text-neutral-500">To</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="rounded border border-neutral-200 px-2 py-1 text-sm"
              />
            </label>
          </div>
        )}
      </div>
    </header>
  )
}
