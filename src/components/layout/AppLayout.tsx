import { Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Footer } from './Footer'
import { Header } from './Header'
import { ToastViewport } from '../ui/ToastViewport'

function isInternalDashboardPath(pathname: string) {
  return pathname === '/staff' || pathname.startsWith('/admin')
}

export function AppLayout() {
  const { pathname } = useLocation()
  const role = useAuthStore((s) => s.user?.role)
  const isInternalUser = role === 'staff' || role === 'admin'
  const showFooter = !isInternalDashboardPath(pathname) && !isInternalUser

  return (
    <div className="relative z-10 flex min-h-screen flex-col overflow-x-hidden text-neutral-900">
      <ToastViewport />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  )
}
