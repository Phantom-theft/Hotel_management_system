import { Outlet } from 'react-router-dom'
import { AdminDashboardShellProvider } from '../../contexts/admin/AdminDashboardShellContext'
import { ToastViewport } from '../ui/ToastViewport'
import {
  AdminDashboardSidebar,
  useCloseAdminSidebarOnNavigate,
} from './AdminDashboardSidebar'
import { AdminDashboardTopBar } from './AdminDashboardTopBar'

function AdminDashboardShell() {
  useCloseAdminSidebarOnNavigate()

  return (
    <div className="min-h-dvh bg-[#F5F6FA]">
      <ToastViewport />
      <AdminDashboardSidebar />
      <div className="lg:pl-64">
        <AdminDashboardTopBar />
        <main className="px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function AdminDashboardLayout() {
  return (
    <AdminDashboardShellProvider>
      <AdminDashboardShell />
    </AdminDashboardShellProvider>
  )
}
