import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../api/hotel'
import { clearSessionCache } from '../queryClient'
import { useAuthStore } from '../store/authStore'
import type { UserRole } from '../types/api'
import { readReturnPath } from '../utils/authRedirect'

function homeForRole(role: UserRole) {
  if (role === 'admin') return '/admin'
  if (role === 'staff') return '/staff'
  return '/rooms'
}

export function LoginPage() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = readReturnPath(location.state)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await login(email, password)
      clearSessionCache()
      setAuth(data.user, data.accessToken)
      navigate(returnTo ?? homeForRole(data.user.role), { replace: true })
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Unable to sign in'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl py-2 sm:py-6">
      <div className="grid min-h-[580px] grid-cols-1 overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-xl shadow-neutral-900/5 lg:grid-cols-12">
        {/* Left Decorative Gradient Panel */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#091326] via-[#0F1E3C] to-[#1B3563] p-6 text-white sm:p-10 lg:col-span-5 lg:p-12">
          {/* Ambient Lighting & Pattern Overlays */}
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"
            aria-hidden
          />

          {/* Top: Clickable Brand Logo */}
          <div className="relative z-10">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-white transition-opacity hover:opacity-90"
            >
              Harborlight
            </Link>
          </div>

          {/* Middle: Tagline & Context */}
          <div className="relative z-10 my-6 lg:my-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
              Guest Portal
            </span>
            <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Welcome back to Harborlight
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-300 sm:text-base">
              Sign in to manage your stays, view upcoming reservations, and access exclusive member rates.
            </p>
          </div>

          {/* Bottom: Testimonial Card */}
          <div className="relative z-10 hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:block">
            <div className="flex items-center gap-1 text-sm text-amber-400" aria-label="5 out of 5 stars">
              <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
            </div>
            <p className="mt-2 text-sm italic leading-relaxed text-neutral-200">
              &ldquo;The calmest stay on the coast. Check-in was effortless, and the harbor views at sunrise were unforgettable.&rdquo;
            </p>
            <p className="mt-3 text-xs font-semibold text-neutral-400">
              Eleanor & Marcus V. <span className="font-normal text-neutral-500">&bull; Returning Guests</span>
            </p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex flex-col justify-center bg-white p-6 sm:p-10 lg:col-span-7 lg:p-12">
          <div className="mx-auto w-full max-w-md">
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
                Sign in to your account
              </h1>
              <p className="mt-2 text-sm text-neutral-500">
                Welcome back! Please enter your details to continue.
              </p>
            </div>

            {error && (
              <div
                className="mt-6 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger"
                role="alert"
              >
                <span className="font-bold">!</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/15"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-neutral-600">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-semibold text-accent hover:text-primary transition hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
