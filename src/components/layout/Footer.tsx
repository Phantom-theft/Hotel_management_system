import { Link, useLocation } from 'react-router-dom'
import { useAuthNavigation } from '../../hooks/useAuthNavigation'
import type { AuthPath } from '../../store/authTransitionStore'

const quickLinks: { path: AuthPath | '/rooms'; label: string; auth?: boolean }[] = [
  { path: '/rooms', label: 'Rooms' },
  { path: '/login', label: 'Sign in', auth: true },
  { path: '/register', label: 'Register', auth: true },
]

const resources = [
  { to: '/rooms', label: 'Find a stay' },
  { to: '/my-bookings', label: 'My bookings' },
]

export function Footer() {
  const location = useLocation()
  const { openAuth } = useAuthNavigation()

  return (
    <footer className="relative z-10 mt-auto w-full bg-primary text-neutral-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:gap-10 sm:py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="font-display text-xl font-extrabold text-white">Harborlight</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-400">
            A single-property hotel with clear rates, calm rooms, and a front desk that knows your
            name.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-white">Quick links</p>
          <ul className="mt-3 sm:mt-4 space-y-1 sm:space-y-2 text-sm">
            {quickLinks.map((l) => (
              <li key={l.path}>
                {l.auth ? (
                  <button
                    type="button"
                    onClick={() => openAuth(l.path as AuthPath)}
                    className={`inline-flex min-h-[36px] items-center transition hover:text-white ${
                      location.pathname === l.path ? 'text-white font-medium' : ''
                    }`}
                  >
                    {l.label}
                  </button>
                ) : (
                  <Link to={l.path} className="inline-flex min-h-[36px] items-center transition hover:text-white">
                    {l.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-white">Resources</p>
          <ul className="mt-3 sm:mt-4 space-y-1 sm:space-y-2 text-sm">
            {resources.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="inline-flex min-h-[36px] items-center transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-white">Contact</p>
          <ul className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-sm text-neutral-400">
            <li>Front desk · Open 24/7</li>
            <li>reservations@harborlight.local</li>
            <li>+1 (555) 010-2000</li>
          </ul>
          <div className="mt-4 sm:mt-5 flex gap-3" aria-label="Social links">
            {['in', 'f', 'x'].map((label) => (
              <span
                key={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-xs font-semibold uppercase text-white/80 transition hover:border-white/40 hover:text-white"
                aria-hidden
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Harborlight Hotel. All rights reserved.</p>
          <p>Single-property hospitality</p>
        </div>
      </div>
    </footer>
  )
}
