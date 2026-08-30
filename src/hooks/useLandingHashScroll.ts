import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { scrollToSection } from '../utils/scroll'

export function useLandingHashScroll() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null
    const hash = location.hash.replace('#', '')
    const target = state?.scrollTo || hash
    if (!target) return

    let attempts = 0
    const maxAttempts = 12

    const tryScroll = () => {
      if (scrollToSection(target)) {
        if (state?.scrollTo) {
          navigate('.', { replace: true, state: {} })
        }
        return
      }
      attempts += 1
      if (attempts < maxAttempts) {
        window.setTimeout(tryScroll, 50)
      }
    }

    tryScroll()
  }, [location.pathname, location.hash, location.state, navigate])
}
