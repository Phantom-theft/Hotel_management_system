import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/hotel'
import { clearSessionCache } from '../queryClient'
import { useAuthStore } from '../store/authStore'

export function RegisterPage() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await register({
        name,
        email,
        password,
        phone: phone || undefined,
      })
      clearSessionCache()
      setAuth(data.user, data.accessToken)
      navigate('/rooms', { replace: true })
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Unable to register'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl py-2 sm:py-6">
      <div className="grid min-h-[620px] grid-cols-1 overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-xl shadow-neutral-900/5 lg:grid-cols-12">
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
              New Guest Experience
            </span>
            <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Join Harborlight
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-300 sm:text-base">
              Create your account in moments to enjoy direct booking guarantees, seamless check-ins, and personalized stays.
            </p>
          </div>

          {/* Bottom: Member Perks Card */}
          <div className="relative z-10 hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/90">
              Harborlight Guest Privileges
            </p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-neutral-200">
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
        </div>

        {/* Right Form Panel */}
        <div className="flex flex-col justify-center bg-white p-6 sm:p-10 lg:col-span-7 lg:p-12">
          <div className="mx-auto w-full max-w-md">
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
                Create your account
              </h1>
              <p className="mt-2 text-sm text-neutral-500">
                Fill in your details to start booking your seaside escape.
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
                  Full name
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/15"
                />
              </div>

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
                  Phone number <span className="font-normal text-neutral-400">(optional)</span>
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 000-0000"
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
                  placeholder="At least 8 characters"
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/15"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-neutral-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-accent hover:text-primary transition hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
