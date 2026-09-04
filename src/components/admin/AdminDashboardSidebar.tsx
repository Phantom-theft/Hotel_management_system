import { useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Shield, X } from 'lucide-react'
import { logout as logoutApi } from '../../api/hotel'
import { ADMIN_DASHBOARD_NAV } from '../../constants/admin/dashboardNav'
import { useAdminDashboardShell } from '../../contexts/admin/AdminDashboardShellContext'
import { clearSessionCache } from '../../queryClient'
import { useAuthStore } from '../../store/authStore'

function navLinkClass(isActive: boolean) {
  return `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'border-l-[3px] border-amber-400 bg-white/10 pl-[9px] text-white'
      : 'border-l-[3px] border-transparent text-white/70 hover:bg-white/5 hover:text-white'
  }`
}

function userInitials(name?: string | null) {
  if (!name?.trim()) return 'DA'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-400/40 bg-white/5">
        <Shield className="h-5 w-5 text-amber-400" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-bold tracking-wide text-white">HARBORLIGHT</p>
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/55">Hotel</p>
      </div>
    </div>
  )
}

export function AdminDashboardSidebar() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()
  const { sidebarOpen, setSidebarOpen } = useAdminDashboardShell()

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

  const displayName = user?.name?.trim() || 'Demo Admin'
  const displayRole =
    user?.role === 'admin'
      ? 'Administrator'
      : user?.role
        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
        : 'Administrator'

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0F1B3D] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <NavLink to="/admin" onClick={() => setSidebarOpen(false)} className="min-w-0">
          <BrandMark />
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

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin dashboard">
        {ADMIN_DASHBOARD_NAV.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              <span className="truncate">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          className="mb-3 flex w-full items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5 text-left transition hover:bg-white/10"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300">
            {userInitials(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            <p className="truncate text-xs text-white/55">{displayRole}</p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-white/45" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="admin-print-hide hidden h-dvh w-64 shrink-0 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:flex-col">
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="admin-print-hide fixed inset-0 z-40 bg-[#0F1B3D]/40 backdrop-blur-sm lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`admin-print-hide fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!sidebarOpen}
      >
        {sidebarContent}
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="admin-print-hide fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-neutral-200/80 bg-white/95 px-1 py-2 backdrop-blur lg:hidden"
        aria-label="Mobile admin navigation"
      >
        {ADMIN_DASHBOARD_NAV.slice(0, 5).map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-medium transition ${
                  isActive ? 'text-[#0F1B3D]' : 'text-neutral-400'
                }`
              }
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}

export function useCloseAdminSidebarOnNavigate() {
  const { pathname } = useLocation()
  const { setSidebarOpen } = useAdminDashboardShell()

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname, setSidebarOpen])
}
