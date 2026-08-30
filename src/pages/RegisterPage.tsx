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
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-3xl font-extrabold text-primary">Create account</h1>
      <p className="mt-2 text-neutral-600">Book stays and manage your reservations.</p>

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
          <span className="mb-1 block font-medium text-neutral-600">Full name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-accent"
          />
        </label>
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
          <span className="mb-1 block font-medium text-neutral-600">Phone (optional)</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-sm text-neutral-600">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
