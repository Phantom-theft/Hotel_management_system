import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Line, LineChart, ResponsiveContainer } from 'recharts'
import { cn } from '../../lib/utils'

interface AdminDashboardStatCardProps {
  label: string
  value: string
  icon?: LucideIcon
  iconClassName?: string
  hint?: string
  change?: number | null
  changeSuffix?: string
  sparklineData?: Array<{ value: number }>
  sparklineColor?: string
}

export function AdminDashboardStatCard({
  label,
  value,
  icon: Icon,
  iconClassName = 'bg-blue-50 text-blue-600',
  hint,
  change,
  changeSuffix = 'from previous period',
  sparklineData,
  sparklineColor = '#3B82F6',
}: AdminDashboardStatCardProps) {
  const hasChange = change != null && Number.isFinite(change)
  const isUp = (change ?? 0) >= 0
  const TrendIcon = isUp ? ArrowUpRight : ArrowDownRight

  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_1px_3px_rgba(15,27,61,0.06),0_4px_16px_rgba(15,27,61,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  iconClassName,
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </div>
            )}
            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              {label}
            </p>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.7rem]">
            {value}
          </p>
          {hasChange ? (
            <p
              className={cn(
                'mt-1.5 inline-flex items-center gap-0.5 text-xs font-medium',
                isUp ? 'text-emerald-600' : 'text-red-500',
              )}
            >
              <TrendIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                {Math.abs(change!).toFixed(1)}% {changeSuffix}
              </span>
            </p>
          ) : (
            hint && <p className="mt-1.5 text-xs text-neutral-400">{hint}</p>
          )}
        </div>

        {sparklineData && sparklineData.length > 1 && (
          <div className="h-12 w-20 shrink-0 self-end sm:h-14 sm:w-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={sparklineColor}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

interface AdminDashboardCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
  headerRight?: ReactNode
  titleAddon?: ReactNode
}

export function AdminDashboardCard({
  title,
  description,
  children,
  className = '',
  headerRight,
  titleAddon,
}: AdminDashboardCardProps) {
  return (
    <section
      className={cn(
        'rounded-xl bg-white p-5 shadow-[0_1px_3px_rgba(15,27,61,0.06),0_4px_16px_rgba(15,27,61,0.04)] sm:p-6',
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
            {titleAddon}
          </div>
          {description && <p className="mt-1 text-sm text-neutral-400">{description}</p>}
        </div>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>
      {children}
    </section>
  )
}
