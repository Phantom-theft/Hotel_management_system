import { useLocation } from 'react-router-dom'
import { useAuthTransitionStore } from '../store/authTransitionStore'

/**
 * Keep the fixed hero backdrop mounted for the entire landing visit and all auth
 * routes/transitions. Never gate on scroll position — unmounting forces a full
 * image reload when opening Sign In from Gallery/Footer.
 */
export function useLandingHeroBackdropVisible() {
  const location = useLocation()
  const phase = useAuthTransitionStore((s) => s.phase)

  const isHome = location.pathname === '/'
  const isAuthRoute =
    location.pathname === '/login' || location.pathname === '/register'

  if (isHome || isAuthRoute) return true
  if (phase === 'entering' || phase === 'exiting' || phase === 'open') return true

  return false
}
