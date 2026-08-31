import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { ToastViewport } from './ToastViewport'

/** Internal staff/admin routes — header only, no site footer */
export function DashboardLayout() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col overflow-x-hidden text-neutral-900">
      <ToastViewport />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
