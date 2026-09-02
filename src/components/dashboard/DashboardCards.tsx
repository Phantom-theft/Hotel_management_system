import type { ReactNode } from 'react'

interface DashboardStatCardProps {
  label: string
  value: string
  hint?: string
  featured?: boolean
}

export function DashboardStatCard({ label, value, hint, featured = false }: DashboardStatCardProps) {
  return (
    <div
      className={`rounded-xl p-5 shadow-card ${
        featured
          ? 'bg-primary text-white shadow-lg shadow-primary/20'
          : 'border border-neutral-100 bg-white'
      }`}
    >
      <p className={`text-sm font-medium ${featured ? 'text-white/75' : 'text-neutral-500'}`}>
        {label}
      </p>
      <p className={`mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl ${featured ? 'text-white' : 'text-primary'}`}>
        {value}
      </p>
      {hint && (
        <p className={`mt-1 text-xs ${featured ? 'text-white/60' : 'text-neutral-400'}`}>{hint}</p>
      )}
    </div>
  )
}

interface DashboardCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function DashboardCard({ title, description, children, className = '' }: DashboardCardProps) {
  return (
    <section className={`rounded-xl border border-neutral-100 bg-white p-5 shadow-card ${className}`}>
      <h2 className="font-display text-lg font-bold text-primary">{title}</h2>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      <div className={description || title ? 'mt-4' : ''}>{children}</div>
    </section>
  )
}
