import { Outlet } from 'react-router-dom'
import { DashboardShellProvider } from '../contexts/DashboardShellContext'
import { DashboardSidebar, useCloseSidebarOnNavigate } from './dashboard/DashboardSidebar'
import { DashboardTopBar } from './dashboard/DashboardTopBar'

function DashboardShell() {
  useCloseSidebarOnNavigate()

  return (
    <div className="min-h-dvh bg-neutral-50">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardTopBar />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function DashboardLayout() {
  return (
    <DashboardShellProvider>
      <DashboardShell />
    </DashboardShellProvider>
  )
}
