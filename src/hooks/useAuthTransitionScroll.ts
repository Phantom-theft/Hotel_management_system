import { useLayoutEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthTransitionStore } from '../store/authTransitionStore'
import { scrollToTopInstant } from '../utils/scroll'

/**
 * Scroll + route prep for auth exit:
 * - Exit: reveal landing at top immediately under the sliding panel (prevents white flash)
 */
export function useAuthTransitionScroll() {
  const location = useLocation()
  const navigate = useNavigate()
  const phase = useAuthTransitionStore((s) => s.phase)

  useLayoutEffect(() => {
    if (phase !== 'exiting') return

    scrollToTopInstant()

    if (location.pathname !== '/') {
      navigate('/', { replace: true })
    }
  }, [phase, location.pathname, navigate])
}
