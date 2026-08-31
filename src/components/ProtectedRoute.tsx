import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthHydrated } from '../hooks/useAuthHydrated'
import { selectIsSessionValid, useAuthStore } from '../store/authStore'
import type { UserRole } from '../types/api'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
  children?: ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const hydrated = useAuthHydrated()
  const sessionValid = useAuthStore(selectIsSessionValid)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!hydrated) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center" aria-busy="true">
        <p className="text-sm text-neutral-500">Loading…</p>
      </div>
    )
  }

  if (!sessionValid || !user) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" replace state={{ from: returnTo }} />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback =
      user.role === 'admin' ? '/admin' : user.role === 'staff' ? '/staff' : '/rooms'
    return <Navigate to={fallback} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
