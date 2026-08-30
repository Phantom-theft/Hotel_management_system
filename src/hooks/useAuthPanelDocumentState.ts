import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthTransitionStore } from '../store/authTransitionStore'

/** Hides landing hero copy via `data-auth-panel` while auth UI is active (no HomePage edits). */
export function useAuthPanelDocumentState() {
  const location = useLocation()
  const phase = useAuthTransitionStore((s) => s.phase)

  const isAuthRoute =
    location.pathname === '/login' || location.pathname === '/register'
  const authActive =
    isAuthRoute || phase === 'entering' || phase === 'open' || phase === 'exiting'

  useLayoutEffect(() => {
    const root = document.documentElement
    if (authActive) {
      root.dataset.authPanel = 'open'
    } else {
      delete root.dataset.authPanel
    }
    return () => {
      delete root.dataset.authPanel
    }
  }, [authActive])
}
