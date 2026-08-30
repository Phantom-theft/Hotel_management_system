import { type ReactNode, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { LoginPageContent } from '../../pages/LoginPage'
import { RegisterPageContent } from '../../pages/RegisterPage'
import { useAuthNavigation } from '../../hooks/useAuthNavigation'
import { useAuthPanelDocumentState } from '../../hooks/useAuthPanelDocumentState'
import { type AuthPath, useAuthTransitionStore } from '../../store/authTransitionStore'
import { useLandingHeroBackdropVisible } from '../../hooks/useLandingHeroBackdropVisible'
import { LandingHeroBackdrop } from '../landing/LandingHeroBackdrop'
import { AuthBrandingPanel } from './AuthBrandingPanel'
import { AuthSlidePanel } from './AuthSlidePanel'

const loginBranding = {
  eyebrow: 'Guest Portal',
  title: 'Welcome back to Harborlight',
  description:
    'Sign in to manage your stays, view upcoming reservations, and access member rates.',
  footer: (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <div className="flex items-center gap-1 text-sm text-amber-400" aria-label="5 out of 5 stars">
        <span>★</span>
        <span>★</span>
        <span>★</span>
        <span>★</span>
        <span>★</span>
      </div>
      <p className="mt-2 text-sm italic leading-relaxed text-neutral-200">
        &ldquo;The calmest stay on the coast. Check-in was effortless, and the harbor views at
        sunrise were unforgettable.&rdquo;
      </p>
      <p className="mt-3 text-xs font-semibold text-neutral-400">
        Eleanor & Marcus V. <span className="font-normal text-neutral-500">· Returning Guests</span>
      </p>
    </div>
  ),
}

const registerBranding = {
  eyebrow: 'New Guest Experience',
  title: 'Join Harborlight',
  description:
    'Create your account in moments to enjoy direct booking guarantees, seamless check-ins, and personalized stays.',
  footer: (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/90">
        Harborlight Guest Privileges
      </p>
      <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-neutral-200">
        <li className="flex items-center gap-2">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-[10px] font-bold text-amber-300">
            ✓
          </span>
          <span>Best Rate Guarantee on all coastal suites</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-[10px] font-bold text-amber-300">
            ✓
          </span>
          <span>Instant reservations with transparent pricing</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-[10px] font-bold text-amber-300">
            ✓
          </span>
          <span>Flexible cancellation options on eligible stays</span>
        </li>
      </ul>
    </div>
  ),
}

function brandingFor(path: AuthPath) {
  return path === '/login' ? loginBranding : registerBranding
}

function formFor(path: AuthPath) {
  return path === '/login' ? <LoginPageContent /> : <RegisterPageContent />
}

export function AuthTransitionRoot({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { closeAuth } = useAuthNavigation()
  const { phase, path, skipEnterAnimation, markOpen, reset, startExit } = useAuthTransitionStore()

  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register'
  const authPath =
    isAuthRoute
      ? (location.pathname as AuthPath)
      : phase === 'entering' || phase === 'exiting' || phase === 'open'
        ? path
        : null
  const showBackdrop = useLandingHeroBackdropVisible()

  const showBranding =
    authPath && (phase === 'entering' || phase === 'open' || phase === 'exiting' || isAuthRoute)
  const showPanel =
    !!authPath &&
    (phase === 'entering' || phase === 'open' || phase === 'exiting' || isAuthRoute)

  const brandingOpen =
    Boolean(authPath) && (phase === 'entering' || phase === 'open' || isAuthRoute)
  const brandingEnterDelay = phase === 'entering' ? 0.45 : 0

  useAuthPanelDocumentState()

  const prevPathnameRef = useRef(location.pathname)

  // Direct /login or /register visit — track open state for back-button exit
  useEffect(() => {
    if (!isAuthRoute) return
    const state = useAuthTransitionStore.getState()
    if (state.phase !== 'idle') return
    useAuthTransitionStore.setState({
      phase: 'open',
      path: location.pathname as AuthPath,
    })
  }, [isAuthRoute, location.pathname])

  // Browser back from auth route to home while panel is open → slide panel closed.
  // Only react to an actual /login|/register → / navigation; do not fire when
  // markOpen() runs while the URL is still / during the enter animation.
  useEffect(() => {
    const prev = prevPathnameRef.current
    const cameFromAuth = prev === '/login' || prev === '/register'
    const nowOnHome = location.pathname === '/'

    if (nowOnHome && cameFromAuth && phase === 'open') {
      startExit()
    }

    prevPathnameRef.current = location.pathname
  }, [location.pathname, phase, startExit])

  function handleEnterComplete() {
    const state = useAuthTransitionStore.getState()
    if (state.phase === 'entering' && state.path) {
      markOpen()
      navigate(state.path)
    }
  }

  function handleExitComplete() {
    if (phase === 'exiting') {
      reset()
      if (location.pathname !== '/') {
        navigate('/', { replace: true })
      }
    }
  }

  return (
    <>
      {showBackdrop && <LandingHeroBackdrop />}
      {children}

      {showBranding && authPath && (
        <aside className="pointer-events-none fixed left-0 top-0 z-[55] hidden h-dvh w-1/2 lg:block">
          <div className="pointer-events-auto h-full">
            <AnimatePresence>
              {brandingOpen && (
                <AuthBrandingPanel
                  key={authPath}
                  {...brandingFor(authPath)}
                  onHome={closeAuth}
                  enterDelay={brandingEnterDelay}
                />
              )}
            </AnimatePresence>
          </div>
        </aside>
      )}

      <AnimatePresence>
        {showPanel && authPath && (
          <AuthSlidePanel
            key={authPath}
            isOpen={phase !== 'exiting'}
            skipEnterAnimation={skipEnterAnimation}
            onEnterComplete={handleEnterComplete}
            onExitComplete={handleExitComplete}
            onClose={closeAuth}
          >
            {formFor(authPath)}
          </AuthSlidePanel>
        )}
      </AnimatePresence>
    </>
  )
}
