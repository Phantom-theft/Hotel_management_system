import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login } from '../../api/hotel'
import { useAuthNavigation } from '../../hooks/useAuthNavigation'
import { clearSessionCache } from '../../queryClient'
import { useAuthStore } from '../../store/authStore'
import { useAuthTransitionStore } from '../../store/authTransitionStore'
import type { UserRole } from '../../types/api'
import { readReturnPath } from '../../utils/authRedirect'

function homeForRole(role: UserRole) {
  if (role === 'admin') return '/admin'
  if (role === 'staff') return '/staff'
  return '/rooms'
}

export function LoginPageContent() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  const location = useLocation()
  const { switchAuth } = useAuthNavigation()
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
      useAuthTransitionStore.getState().reset()
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
    <>
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
            className="mt-1.5 min-h-[44px] w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/15"
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
            className="mt-1.5 min-h-[44px] w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/15"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex min-h-[44px] w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-neutral-600">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={() => switchAuth('/register')}
          className="font-bold text-primary transition hover:underline"
        >
          Create one
        </button>
      </p>
    </>
  )
}

/** Route placeholder — UI is rendered by AuthTransitionRoot */
export function LoginPage() {
  return null
}
