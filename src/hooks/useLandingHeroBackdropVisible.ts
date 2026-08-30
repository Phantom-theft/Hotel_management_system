import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthTransitionStore } from '../store/authTransitionStore'

/** When the fixed hero image should render (hero in view, auth routes, or panel transition). */
export function useLandingHeroBackdropVisible() {
  const location = useLocation()
  const phase = useAuthTransitionStore((s) => s.phase)
  const [heroInView, setHeroInView] = useState(true)

  const isHome = location.pathname === '/'
  const isAuthRoute =
    location.pathname === '/login' || location.pathname === '/register'

  useEffect(() => {
    if (!isHome) return

    const hero = document.getElementById('hero')
    if (!hero) {
      setHeroInView(false)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => setHeroInView(entry.isIntersecting),
      { threshold: 0 },
    )

    observer.observe(hero)
    return () => observer.disconnect()
  }, [isHome])

  if (isAuthRoute) return true
  if (phase === 'entering' || phase === 'exiting' || phase === 'open') return true
  if (isHome && heroInView) return true

  return false
}
