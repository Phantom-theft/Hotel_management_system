import type { ReactNode } from 'react'

interface AdminDashboardStatCardProps {
  label: string
  value: string
  hint?: string
  featured?: boolean
}

export function AdminDashboardStatCard({
  label,
  value,
  hint,
  featured = false,
}: AdminDashboardStatCardProps) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 ${
        featured ? 'border-primary/20 ring-1 ring-primary/5' : 'border-neutral-200/70'
      }`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold tracking-tight sm:text-[1.75rem] ${
          featured ? 'text-primary' : 'text-neutral-900'
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-neutral-400">{hint}</p>}
    </div>
  )
}

interface AdminDashboardCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function AdminDashboardCard({
  title,
  description,
  children,
  className = '',
}: AdminDashboardCardProps) {
  return (
    <section className={`rounded-2xl border border-neutral-200/70 bg-white p-5 sm:p-6 ${className}`}>
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
        {description && <p className="mt-1 text-xs text-neutral-400">{description}</p>}
      </div>
      {children}
    </section>
  )
}
