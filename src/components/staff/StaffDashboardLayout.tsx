import { Outlet } from 'react-router-dom'
import { StaffDashboardShellProvider } from '../../contexts/staff/StaffDashboardShellContext'
import {
  StaffDashboardSidebar,
  useCloseStaffSidebarOnNavigate,
} from './StaffDashboardSidebar'
import { StaffDashboardTopBar } from './StaffDashboardTopBar'

function StaffDashboardShell() {
  useCloseStaffSidebarOnNavigate()

  return (
    <div className="min-h-dvh bg-neutral-50">
      <StaffDashboardSidebar />
      <div className="lg:pl-64">
        <StaffDashboardTopBar />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function StaffDashboardLayout() {
  return (
    <StaffDashboardShellProvider>
      <StaffDashboardShell />
    </StaffDashboardShellProvider>
  )
}
