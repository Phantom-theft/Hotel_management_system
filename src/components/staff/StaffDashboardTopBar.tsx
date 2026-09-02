import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { staffDashboardTitleForPath } from '../../constants/staff/dashboardNav'
import { useStaffDashboardShell } from '../../contexts/staff/StaffDashboardShellContext'

export function StaffDashboardTopBar() {
  const { pathname } = useLocation()
  const { setSidebarOpen } = useStaffDashboardShell()
  const title = staffDashboardTitleForPath(pathname)

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
      </div>
    </header>
  )
}
