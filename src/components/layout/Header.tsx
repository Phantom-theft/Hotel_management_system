import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { logout as logoutApi } from '../../api/hotel'
import { LANDING_NAV_ANCHORS, LANDING_SECTION_IDS } from '../../constants/landing'
import { useLandingScrollSpy } from '../../hooks/useLandingScrollSpy'
import { useAuthNavigation } from '../../hooks/useAuthNavigation'
import { clearSessionCache } from '../../queryClient'
import { useAuthStore } from '../../store/authStore'
import type { UserRole } from '../../types/api'
import { scrollToSection, scrollToTop } from '../../utils/scroll'
import { UserAvatar } from '../ui/UserAvatar'

const appRouteLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm tracking-wide transition ${
    isActive ? 'text-primary font-semibold' : 'text-neutral-600 hover:text-primary font-medium'
  }`

const mobileAppRouteLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-[44px] w-full items-center px-3 py-2.5 text-sm tracking-wide rounded-lg transition ${
    isActive ? 'text-primary font-semibold bg-neutral-100/70' : 'text-neutral-700 hover:text-primary hover:bg-neutral-50 font-medium'
  }`

function appNavLinksForRole(role: UserRole | undefined) {
  switch (role) {
    case 'admin':
      return [
        { to: '/admin', label: 'Dashboard' },
        { to: '/admin/rooms', label: 'Rooms' },
        { to: '/admin/bookings', label: 'Bookings' },
        { to: '/admin/promotions', label: 'Promotions' },
        { to: '/admin/reviews', label: 'Reviews' },
        { to: '/admin/staff', label: 'Staff' },
        { to: '/admin/reports', label: 'Reports' },
        { to: '/admin/profile', label: 'Profile' },
      ]
    case 'staff':
      return [
        { to: '/staff', label: 'Desk', end: true },
        { to: '/staff/rooms', label: 'Rooms' },
        { to: '/staff/profile', label: 'Profile' },
      ]
    case 'customer':
      return [
        { to: '/rooms', label: 'Rooms' },
        { to: '/my-bookings', label: 'My bookings' },
        { to: '/profile', label: 'Profile' },
      ]
    default:
      return []
  }
}

export function Header() {
  const { isAuthenticated, user, clearAuth } = useAuthStore()
  const { openAuth } = useAuthNavigation()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const isHome = location.pathname === '/'
  const showMarketingNav = isHome
  const activeSection = useLandingScrollSpy(LANDING_SECTION_IDS, isHome)
  const homeActive = isHome && activeSection === null
  const appNavLinks = appNavLinksForRole(user?.role)

  const isTransparent = isHome && !isScrolled && !mobileOpen

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isHome) return

    const handleScroll = () => {
      const hero = document.getElementById('hero')
      if (hero) {
        const rect = hero.getBoundingClientRect()
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
      navigate('/', { replace: true, state: null })
    }
  }

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

  const desktopNavItemClass = (active: boolean) =>
    `text-sm tracking-wide transition-colors duration-300 ${
      isTransparent
        ? active
          ? 'text-white font-semibold'
          : 'text-white/80 hover:text-white font-medium'
        : active
          ? 'text-primary font-semibold'
          : 'text-neutral-600 hover:text-primary font-medium'
    }`

  const desktopRouteLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm tracking-wide transition-colors duration-300 ${
      isTransparent
        ? isActive
          ? 'text-white font-semibold'
          : 'text-white/80 hover:text-white font-medium'
        : isActive
          ? 'text-primary font-semibold'
          : 'text-neutral-600 hover:text-primary font-medium'
    }`

  const mobileNavItemClass = (active: boolean) =>
    `flex min-h-[44px] w-full items-center px-3 py-2.5 text-left text-sm tracking-wide rounded-lg transition ${
      active
        ? 'text-primary font-semibold bg-neutral-100/70'
        : 'text-neutral-700 hover:text-primary hover:bg-neutral-50 font-medium'
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
          {showMarketingNav ? (
            <>
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
                  className={desktopNavItemClass(activeSection === item.id)}
                >
                  {item.label}
                </button>
              ))}
            </>
          ) : (
            appNavLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={appRouteLinkClass}
              >
                {link.label}
              </NavLink>
            ))
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isAuthenticated ? (
            showMarketingNav && !mobileOpen && (
              <button
                type="button"
                onClick={() => openAuth('/login')}
                className={`${desktopRouteLinkClass({ isActive: location.pathname === '/login' })} hidden sm:inline`}
              >
                Sign in
              </button>
            )
          ) : (
            <>
              <NavLink
                to={
                  user?.role === 'admin'
                    ? '/admin/profile'
                    : user?.role === 'staff'
                      ? '/staff/profile'
                      : '/profile'
                }
                className={`hidden items-center gap-2 lg:inline-flex transition-colors duration-300 ${
                  isTransparent ? 'text-white/80 hover:text-white' : 'text-neutral-500 hover:text-primary'
                }`}
              >
                <UserAvatar
                  name={user?.name ?? 'User'}
                  avatarUrl={user?.avatarUrl}
                  className={`h-8 w-8 rounded-full text-[10px] ${
                    isTransparent ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary'
                  }`}
                />
                <span className="max-w-[8rem] truncate text-sm xl:max-w-none">{user?.name}</span>
              </NavLink>
              {!mobileOpen && (
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
              )}
            </>
          )}

          <button
            type="button"
            className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border p-2.5 transition-colors duration-300 lg:hidden ${
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
            {showMarketingNav ? (
              <>
                <li>
                  <button type="button" onClick={goHome} className={mobileNavItemClass(homeActive)}>
                    Home
                  </button>
                </li>
                {isAuthenticated && (
                  <li>
                    <NavLink to="/rooms" className={mobileAppRouteLinkClass} onClick={closeMobile}>
                      Rooms
                    </NavLink>
                  </li>
                )}
                {LANDING_NAV_ANCHORS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => goToSection(item.id)}
                      className={mobileNavItemClass(activeSection === item.id)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </>
            ) : (
              appNavLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={mobileAppRouteLinkClass}
                    onClick={closeMobile}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))
            )}
          </ul>

          <div className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-4">
            {!isAuthenticated ? (
              showMarketingNav && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobile()
                      openAuth('/login')
                    }}
                    className={mobileNavItemClass(location.pathname === '/login')}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobile()
                      openAuth('/register')
                    }}
                    className="flex min-h-[44px] w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light active:scale-[0.99]"
                  >
                    Create account
                  </button>
                </>
              )
            ) : (
              <>
                <p className="px-3 py-1 text-sm text-neutral-500">{user?.name}</p>
                <button
                  type="button"
                  onClick={() => {
                    closeMobile()
                    void handleLogout()
                  }}
                  className="flex min-h-[44px] w-full items-center px-3 py-2 text-left text-sm font-medium text-neutral-700 hover:text-primary hover:bg-neutral-50 rounded-lg transition"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
