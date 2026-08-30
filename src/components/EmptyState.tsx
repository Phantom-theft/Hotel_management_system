import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface EmptyStateProps {
  title: string
  description: string
  icon?: ReactNode
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  actionTo,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center shadow-card">
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <h3 className="font-display text-xl font-bold text-primary">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-600">{description}</p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
