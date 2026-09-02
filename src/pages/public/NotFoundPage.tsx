import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">404</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold text-primary">Page not found</h1>
      <p className="mt-3 text-neutral-600">
        The page you requested doesn&apos;t exist or may have moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light"
        >
          Home
        </Link>
        <Link
          to="/rooms"
          className="rounded-md border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          Browse rooms
        </Link>
      </div>
    </div>
  )
}
