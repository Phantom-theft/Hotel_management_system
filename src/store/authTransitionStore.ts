import { create } from 'zustand'

export type AuthPath = '/login' | '/register'

export type AuthPanelPhase = 'idle' | 'entering' | 'open' | 'exiting'

interface AuthTransitionState {
  phase: AuthPanelPhase
  path: AuthPath | null
  skipEnterAnimation: boolean
  startEnter: (path: AuthPath) => void
  markOpen: () => void
  startExit: () => void
  reset: () => void
}

export const useAuthTransitionStore = create<AuthTransitionState>((set) => ({
  phase: 'idle',
  path: null,
  skipEnterAnimation: false,
  startEnter: (path) => set({ phase: 'entering', path, skipEnterAnimation: false }),
  markOpen: () => set({ phase: 'open', skipEnterAnimation: true }),
  startExit: () => set({ phase: 'exiting', skipEnterAnimation: false }),
  reset: () => set({ phase: 'idle', path: null, skipEnterAnimation: false }),
}))
