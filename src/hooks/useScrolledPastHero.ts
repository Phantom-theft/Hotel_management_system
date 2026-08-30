import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { SCROLL_REVEAL_THRESHOLD } from '../components/landing/LandingHeroBackdrop'

/** True when the landing hero section has scrolled out of view. */
export function useScrolledPastHero() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [scrolledPastHero, setScrolledPastHero] = useState(false)

  useEffect(() => {
    if (!isHome) {
      setScrolledPastHero(false)
      return
    }

    const update = () => {
      const hero = document.getElementById('hero')
      if (hero) {
        setScrolledPastHero(hero.getBoundingClientRect().bottom <= 0)
      } else {
        setScrolledPastHero(window.scrollY > SCROLL_REVEAL_THRESHOLD)
      }
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [isHome])

  return scrolledPastHero
}
