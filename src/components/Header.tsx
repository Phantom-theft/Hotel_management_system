import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { logout as logoutApi } from '../api/hotel'
import { LANDING_NAV_ANCHORS, LANDING_SECTION_IDS } from '../constants/landing'
import { useLandingScrollSpy } from '../hooks/useLandingScrollSpy'
import { clearSessionCache } from '../queryClient'
import { useAuthStore } from '../store/authStore'
import { scrollToSection, scrollToTop } from '../utils/scroll'

export function Header() {
  const { isAuthenticated, user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const isHome = location.pathname === '/'
  const activeSection = useLandingScrollSpy(LANDING_SECTION_IDS, isHome)
  const homeActive = isHome && activeSection === null

  // On the landing page, navbar is transparent when over the hero and mobile menu is closed
  const isTransparent = isHome && !isScrolled && !mobileOpen

  useEffect(() => {
    if (!isHome) return

    const handleScroll = () => {
      const hero = document.getElementById('hero')
      if (hero) {
        const rect = hero.getBoundingClientRect()
        // Scrolled past hero once hero's bottom reaches the navbar bottom edge (~70px)
        setIsScrolled(rect.bottom <= 70)
      } else {
        setIsScrolled(window.scrollY > 80)
      }
    }

    const rafId = requestAnimationFrame(handleScroll)
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isHome])

  async function handleLogout() {
    try {
      await logoutApi()
    } catch {
      // still clear local session
    } finally {
      clearSessionCache()
      clearAuth()
      navigate('/')
    }
  }

  const cta =
    user?.role === 'admin'
      ? { to: '/admin', label: 'Admin' }
      : user?.role === 'staff'
        ? { to: '/staff', label: 'Desk' }
        : null

  function closeMobile() {
    setMobileOpen(false)
  }

  function goHome() {
    closeMobile()
    if (isHome) {
      scrollToTop()
    } else {
      navigate('/')
    }
  }

  function goToSection(sectionId: string) {
    closeMobile()
    if (isHome) {
      scrollToSection(sectionId)
    } else {
      navigate('/', { state: { scrollTo: sectionId } })
    }
  }

  // Desktop nav item styling based on active & transparent state
  const desktopNavItemClass = (active: boolean) =>
    `text-sm font-medium tracking-wide transition-colors duration-300 ${
      isTransparent
        ? active
          ? 'text-white font-semibold'
          : 'text-white/80 hover:text-white'
        : active
          ? 'text-accent'
          : 'text-neutral-600 hover:text-primary'
    }`

  const desktopRouteLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium tracking-wide transition-colors duration-300 ${
      isTransparent
        ? isActive
          ? 'text-white font-semibold'
          : 'text-white/80 hover:text-white'
        : isActive
          ? 'text-accent'
          : 'text-neutral-600 hover:text-primary'
    }`

  // Mobile menu items always render on a solid white dropdown background
  const mobileNavItemClass = (active: boolean) =>
    `block w-full py-2 text-left text-sm font-medium tracking-wide transition ${
      active ? 'text-accent' : 'text-neutral-700 hover:text-primary'
    }`

  const mobileRouteLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block py-2 text-sm font-medium tracking-wide transition ${
      isActive ? 'text-accent' : 'text-neutral-700 hover:text-primary'
    }`

  return (
    <header
      className={`${
        isHome ? 'fixed' : 'sticky'
      } top-0 left-0 right-0 z-30 transition-all duration-300 ${
        isTransparent
          ? 'border-b border-transparent bg-transparent shadow-none'
          : 'border-b border-neutral-100 bg-white/95 backdrop-blur shadow-sm'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
        <Link
          to="/"
          onClick={(e) => {
            if (isHome) {
              e.preventDefault()
              scrollToTop()
            }
          }}
          className={`shrink-0 font-display text-xl font-extrabold tracking-tight sm:text-2xl transition-colors duration-300 ${
            isTransparent ? 'text-white hover:text-white/90 drop-shadow-sm' : 'text-primary'
          }`}
        >
          Harborlight
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-4 xl:gap-5 lg:flex" aria-label="Primary">
          <button type="button" onClick={goHome} className={desktopNavItemClass(homeActive)}>
            Home
          </button>
          {isAuthenticated && (
            <NavLink to="/rooms" className={desktopRouteLinkClass}>
              Rooms
            </NavLink>
          )}
          {LANDING_NAV_ANCHORS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goToSection(item.id)}
              className={desktopNavItemClass(isHome && activeSection === item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isAuthenticated ? (
            <NavLink
              to="/login"
              className={`${desktopRouteLinkClass({ isActive: location.pathname === '/login' })} hidden sm:inline`}
            >
              Sign in
            </NavLink>
          ) : (
            <>
              <span
                className={`hidden max-w-[8rem] truncate text-sm lg:inline xl:max-w-none transition-colors duration-300 ${
                  isTransparent ? 'text-white/80' : 'text-neutral-500'
                }`}
              >
                {user?.name}
              </span>
              {cta && (
                <Link
                  to={cta.to}
                  className={`hidden rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 sm:inline-flex ${
                    isTransparent
                      ? 'bg-white text-primary hover:bg-white/90 shadow-sm'
                      : 'bg-primary text-white hover:bg-primary-light'
                  }`}
                >
                  {cta.label}
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className={`hidden rounded-full border px-3 py-2 text-sm font-medium transition-colors duration-300 sm:inline-flex ${
                  isTransparent
                    ? 'border-white/30 text-white hover:bg-white/10'
                    : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Sign out
              </button>
            </>
          )}

          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-lg border p-2 transition-colors duration-300 lg:hidden ${
              isTransparent
                ? 'border-white/30 text-white hover:bg-white/10'
                : 'border-neutral-200 text-primary hover:bg-neutral-50'
            }`}
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-nav"
          className="border-t border-neutral-100 bg-white px-4 py-4 shadow-xl lg:hidden"
          aria-label="Mobile"
        >
          <ul className="space-y-1">
            <li>
              <button type="button" onClick={goHome} className={mobileNavItemClass(homeActive)}>
                Home
              </button>
            </li>
            {isAuthenticated && (
              <li>
                <NavLink
                  to="/rooms"
                  className={mobileRouteLinkClass}
                  onClick={closeMobile}
                >
                  Rooms
                </NavLink>
              </li>
            )}
            {LANDING_NAV_ANCHORS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => goToSection(item.id)}
                  className={mobileNavItemClass(isHome && activeSection === item.id)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-4">
            {!isAuthenticated ? (
              <NavLink
                to="/login"
                className={mobileRouteLinkClass}
                onClick={closeMobile}
              >
                Sign in
              </NavLink>
            ) : (
              <>
                {user?.role === 'customer' && (
                  <NavLink to="/my-bookings" className={mobileRouteLinkClass} onClick={closeMobile}>
                    My bookings
                  </NavLink>
                )}
                {(user?.role === 'staff' || user?.role === 'admin') && (
                  <NavLink to="/staff" className={mobileRouteLinkClass} onClick={closeMobile}>
                    Desk
                  </NavLink>
                )}
                {user?.role === 'admin' && (
                  <NavLink to="/admin" className={mobileRouteLinkClass} onClick={closeMobile}>
                    Admin
                  </NavLink>
                )}
                <button
                  type="button"
                  onClick={() => {
                    closeMobile()
                    void handleLogout()
                  }}
                  className="py-2 text-left text-sm font-medium text-neutral-700 hover:text-primary"
                >
                  Sign out
                </button>
                {cta && (
                  <Link
                    to={cta.to}
                    onClick={closeMobile}
                    className="inline-flex justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light"
                  >
                    {cta.label}
                  </Link>
                )}
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
