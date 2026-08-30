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
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-3xl font-extrabold text-primary">Sign in</h1>
      <p className="mt-2 text-neutral-600">Access your Harborlight account.</p>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-4 rounded-xl border border-neutral-100 bg-white p-6 shadow-card"
      >
        {error && (
          <p
            className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {error}
          </p>
        )}
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-600">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-accent"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-600">Password</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-primary px-4 py-2.5 font-semibold text-white transition hover:bg-primary-light disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-4 text-sm text-neutral-600">
        No account?{' '}
        <Link to="/register" className="font-semibold text-accent hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}
