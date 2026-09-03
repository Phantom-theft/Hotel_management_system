import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { adminDashboardTitleForPath } from '../../constants/admin/dashboardNav'
import { useAdminDashboardShell } from '../../contexts/admin/AdminDashboardShellContext'

export function AdminDashboardTopBar() {
  const { pathname } = useLocation()
  const { setSidebarOpen } = useAdminDashboardShell()
  const title = adminDashboardTitleForPath(pathname)

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
