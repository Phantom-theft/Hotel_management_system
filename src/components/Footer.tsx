import { Link } from 'react-router-dom'

const quickLinks = [
  { to: '/rooms', label: 'Rooms' },
  { to: '/login', label: 'Sign in' },
  { to: '/register', label: 'Register' },
]

const resources = [
  { to: '/rooms', label: 'Find a stay' },
  { to: '/my-bookings', label: 'My bookings' },
]

export function Footer() {
  return (
    <footer className="relative z-10 mt-auto w-full bg-primary text-neutral-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="font-display text-xl font-extrabold text-white">Harborlight</p>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            A single-property hotel with clear rates, calm rooms, and a front desk that knows your
            name.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-white">Quick links</p>
          <ul className="mt-4 space-y-2 text-sm">
            {quickLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-white">Resources</p>
          <ul className="mt-4 space-y-2 text-sm">
            {resources.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-white">Contact</p>
          <ul className="mt-4 space-y-2 text-sm text-neutral-400">
            <li>Front desk · Open 24/7</li>
            <li>reservations@harborlight.local</li>
            <li>+1 (555) 010-2000</li>
          </ul>
          <div className="mt-5 flex gap-3" aria-label="Social links">
            {['in', 'f', 'x'].map((label) => (
              <span
                key={label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-xs font-semibold uppercase text-white/80"
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
