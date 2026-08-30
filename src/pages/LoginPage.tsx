import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../api/hotel'
import { AuthBrandingPanel, AuthSplitShell } from '../components/auth/AuthSplitShell'
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
    <AuthSplitShell
      branding={
        <AuthBrandingPanel
          eyebrow="Guest Portal"
          title="Welcome back to Harborlight"
          description="Sign in to manage your stays, view upcoming reservations, and access member rates."
          footer={
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
                Eleanor & Marcus V.{' '}
                <span className="font-normal text-neutral-500">· Returning Guests</span>
              </p>
            </div>
          }
        />
      }
    >
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary sm:text-3xl lg:text-4xl">
          Sign in to your account
        </h1>
        <p className="mt-2 text-sm text-neutral-500 sm:text-base">
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
          <label className="block text-sm font-medium text-neutral-700">Email address</label>
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
          <label className="block text-sm font-medium text-neutral-700">Password</label>
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
        <Link
          to="/register"
          className="font-semibold text-accent transition hover:text-primary hover:underline"
        >
          Create one
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-neutral-400">
        <Link to="/" className="transition hover:text-neutral-600 hover:underline">
          ← Return to Harborlight home
        </Link>
      </p>
    </AuthSplitShell>
  )
}
