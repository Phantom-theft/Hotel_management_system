import { useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, X } from 'lucide-react'
import { logout as logoutApi } from '../../api/hotel'
import { dashboardNavForRole } from '../../constants/dashboardNav'
import { useDashboardShell } from '../../contexts/DashboardShellContext'
import { clearSessionCache } from '../../queryClient'
import { useAuthStore } from '../../store/authStore'

function navLinkClass(isActive: boolean) {
  return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'border-l-4 border-amber-400 bg-white/10 pl-2.5 text-white'
      : 'text-white/75 hover:bg-white/5 hover:text-white'
  }`
}

export function DashboardSidebar() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()
  const { sidebarOpen, setSidebarOpen } = useDashboardShell()
  const navItems = dashboardNavForRole(user?.role)

  async function handleLogout() {
    try {
      await logoutApi()
    } catch {
      // still clear local session
    } finally {
      clearSessionCache()
      clearAuth()
      navigate('/')
    }
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-primary text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <NavLink
          to={user?.role === 'admin' ? '/admin' : '/staff'}
          onClick={() => setSidebarOpen(false)}
          className="font-display text-xl font-extrabold tracking-tight text-white"
        >
          Harborlight
        </NavLink>
        <button
          type="button"
          className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Dashboard">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 rounded-lg bg-white/5 px-3 py-2.5">
          <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
          <p className="text-xs capitalize text-white/60">{user?.role}</p>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden h-dvh w-64 shrink-0 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:flex-col">
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-primary/40 backdrop-blur-sm lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!sidebarOpen}
      >
        {sidebarContent}
      </aside>
    </>
  )
}

export function useCloseSidebarOnNavigate() {
  const { pathname } = useLocation()
  const { setSidebarOpen } = useDashboardShell()

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname, setSidebarOpen])
}
