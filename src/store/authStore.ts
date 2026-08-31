import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserRole } from '../types/api'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string) => void
  clearAuth: () => void
  hasRole: (...roles: UserRole[]) => boolean
}

function isValidSession(user: User | null, accessToken: string | null, isAuthenticated: boolean) {
  return isAuthenticated && !!user && !!accessToken
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) =>
        set({
          user,
          accessToken,
          isAuthenticated: true,
        }),
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }),
      hasRole: (...roles) => {
        const role = get().user?.role
        return !!role && roles.includes(role)
      },
    }),
    {
      name: 'hotel-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        if (!isValidSession(state.user, state.accessToken, state.isAuthenticated)) {
          state.user = null
          state.accessToken = null
          state.isAuthenticated = false
        }
      },
    },
  ),
)

export function selectIsSessionValid(state: AuthState) {
  return isValidSession(state.user, state.accessToken, state.isAuthenticated)
}
