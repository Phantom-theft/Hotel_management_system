import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { UserRole } from '../types/api'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
  children?: ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated || !user) {
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
