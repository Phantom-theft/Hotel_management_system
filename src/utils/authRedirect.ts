import type { UserRole } from '../types/api'

/** Build a /login location that returns the user to `returnTo` after sign-in */
export function loginWithReturn(returnTo: string) {
  return {
    pathname: '/login' as const,
    state: { from: returnTo },
  }
}

export function readReturnPath(state: unknown): string | undefined {
  const from = (state as { from?: string } | null)?.from
  if (!from || from === '/login' || from === '/register') return undefined
  // Ignore absolute URLs / protocol-relative paths
  if (!from.startsWith('/') || from.startsWith('//')) return undefined
  return from
}

export function homeForRole(role: UserRole): string {
  if (role === 'admin') return '/admin'
  if (role === 'staff') return '/staff'
  return '/rooms'
}

/**
 * After login, only honor `returnTo` when that path is allowed for the signed-in role.
 * Prevents e.g. staff/admin inheriting a leftover customer `/rooms` redirect and landing
 * in the guest shell after switching accounts.
 */
export function resolvePostLoginPath(role: UserRole, returnTo: string | undefined): string {
  const home = homeForRole(role)
  if (!returnTo) return home

  const path = returnTo.split(/[?#]/)[0] ?? returnTo

  if (role === 'admin') {
    if (path === '/admin' || path.startsWith('/admin/')) return returnTo
    return home
  }

  if (role === 'staff') {
    // Only staff shell paths — never inherit guest /rooms from a prior customer session
    if (path === '/staff' || path.startsWith('/staff/')) return returnTo
    if (path === '/profile') return '/staff/profile'
    return home
  }

  // customer — never bounce into staff/admin shells
  if (path === '/admin' || path.startsWith('/admin/') || path === '/staff' || path.startsWith('/staff/')) {
    return home
  }
  return returnTo
}
