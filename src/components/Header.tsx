import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { logout as logoutApi } from '../api/hotel'
import { LANDING_NAV_ANCHORS, LANDING_SECTION_IDS } from '../constants/landing'
import { useLandingScrollSpy } from '../hooks/useLandingScrollSpy'
import { clearSessionCache } from '../queryClient'
import { useAuthStore } from '../store/authStore'
import { scrollToSection, scrollToTop } from '../utils/scroll'

const routeLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium tracking-wide transition ${
    isActive ? 'text-accent' : 'text-neutral-600 hover:text-primary'
  }`

function navItemClass(active: boolean) {
  return `text-sm font-medium tracking-wide transition ${
    active ? 'text-accent' : 'text-neutral-600 hover:text-primary'
  }`
}

export function Header() {
  const { isAuthenticated, user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isHome = location.pathname === '/'
  const activeSection = useLandingScrollSpy(LANDING_SECTION_IDS, isHome)
  const homeActive = isHome && activeSection === null

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

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
        <Link
          to="/"
          onClick={(e) => {
            if (isHome) {
              e.preventDefault()
              scrollToTop()
            }
          }}
          className="shrink-0 font-display text-xl font-extrabold tracking-tight text-primary sm:text-2xl"
        >
          Harborlight
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-4 xl:gap-5 lg:flex" aria-label="Primary">
          <button type="button" onClick={goHome} className={navItemClass(homeActive)}>
            Home
          </button>
          {isAuthenticated && (
            <NavLink to="/rooms" className={routeLinkClass}>
              Rooms
            </NavLink>
          )}
          {LANDING_NAV_ANCHORS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goToSection(item.id)}
              className={navItemClass(isHome && activeSection === item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isAuthenticated ? (
            <NavLink
              to="/login"
              className={`${routeLinkClass({ isActive: false })} hidden sm:inline`}
            >
              Sign in
            </NavLink>
          ) : (
            <>
              <span className="hidden max-w-[8rem] truncate text-sm text-neutral-500 lg:inline xl:max-w-none">
                {user?.name}
              </span>
              {cta && (
                <Link
                  to={cta.to}
                  className="hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-light sm:inline-flex"
                >
                  {cta.label}
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-full border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 sm:inline-flex"
              >
                Sign out
              </button>
            </>
          )}

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-neutral-200 p-2 text-primary lg:hidden"
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
          className="border-t border-neutral-100 bg-white px-4 py-4 lg:hidden"
          aria-label="Mobile"
        >
          <ul className="space-y-1">
            <li>
              <button type="button" onClick={goHome} className={`block w-full py-2 text-left ${navItemClass(homeActive)}`}>
                Home
              </button>
            </li>
            {isAuthenticated && (
              <li>
                <NavLink
                  to="/rooms"
                  className={(props) => `block py-2 ${routeLinkClass(props)}`}
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
                  className={`block w-full py-2 text-left ${navItemClass(isHome && activeSection === item.id)}`}
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
                className={(props) => `block py-2 ${routeLinkClass(props)}`}
                onClick={closeMobile}
              >
                Sign in
              </NavLink>
            ) : (
              <>
                {user?.role === 'customer' && (
                  <NavLink to="/my-bookings" className={routeLinkClass} onClick={closeMobile}>
                    My bookings
                  </NavLink>
                )}
                {(user?.role === 'staff' || user?.role === 'admin') && (
                  <NavLink to="/staff" className={routeLinkClass} onClick={closeMobile}>
                    Desk
                  </NavLink>
                )}
                {user?.role === 'admin' && (
                  <NavLink to="/admin" className={routeLinkClass} onClick={closeMobile}>
                    Admin
                  </NavLink>
                )}
                <button
                  type="button"
                  onClick={() => {
                    closeMobile()
                    void handleLogout()
                  }}
                  className="py-2 text-left text-sm font-medium text-neutral-700"
                >
                  Sign out
                </button>
                {cta && (
                  <Link
                    to={cta.to}
                    onClick={closeMobile}
                    className="inline-flex justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white"
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
