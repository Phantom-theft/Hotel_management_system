import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Star } from 'lucide-react'
import { cn } from '../../lib/utils'
import {
  bookingSharePercent,
  ratingQualitativeLabel,
} from '../../utils/reviewAggregates'

interface ChartTooltipPoint {
  value?: number | string | Array<number | string>
  name?: string | number
}

interface AdminChartTooltipProps {
  active?: boolean
  payload?: ReadonlyArray<ChartTooltipPoint>
  label?: string | number
  valueFormatter?: (value: number, name?: string) => string
  labelFormatter?: (label: unknown) => string
}

/** Soft SaaS-style hover card for dashboard AreaCharts. */
export function AdminChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  labelFormatter,
}: AdminChartTooltipProps) {
  if (!active || !payload?.length) return null

  const point = payload[0]
  const raw = Number(Array.isArray(point.value) ? point.value[0] : point.value)
  const name = point.name != null ? String(point.name) : undefined
  const formatted = valueFormatter
    ? valueFormatter(raw, name)
    : Number.isFinite(raw)
      ? String(raw)
      : '—'
  const title = labelFormatter ? labelFormatter(label) : label != null ? String(label) : ''

  return (
    <div className="rounded-xl border border-neutral-100 bg-white px-3.5 py-2.5 shadow-[0_8px_24px_rgba(15,27,61,0.12)]">
      {title && <p className="text-[11px] font-medium text-neutral-400">{title}</p>}
      <p className="mt-0.5 text-sm font-semibold text-[#0F1B3D]">{formatted}</p>
      {name && (
        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">{name}</p>
      )}
    </div>
  )
}

export function RoomOccupancyWidget({
  total,
  available,
  occupied,
  maintenance,
  className,
  compact = false,
}: {
  total: number
  available: number
  occupied: number
  maintenance: number
  className?: string
  compact?: boolean
}) {
  const segments = [
    { key: 'available', label: 'Available', count: available, color: 'bg-emerald-500', dot: 'bg-emerald-500' },
    { key: 'occupied', label: 'Occupied', count: occupied, color: 'bg-[#0F1B3D]', dot: 'bg-[#0F1B3D]' },
    { key: 'maintenance', label: 'Maintenance', count: maintenance, color: 'bg-amber-500', dot: 'bg-amber-500' },
  ] as const

  const safeTotal = total > 0 ? total : 0

  return (
    <div className={cn(compact ? 'space-y-3' : 'space-y-5', className)}>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p
            className={cn(
              'font-medium uppercase tracking-wider text-neutral-400',
              compact ? 'text-[10px]' : 'text-[11px]',
            )}
          >
            Total rooms
          </p>
          <p
            className={cn(
              'font-bold tracking-tight text-neutral-900',
              compact ? 'mt-0.5 text-3xl' : 'mt-1 text-4xl',
            )}
          >
            {safeTotal}
          </p>
        </div>
      </div>

      <div
        className={cn(
          'flex w-full overflow-hidden rounded-full bg-neutral-100',
          compact ? 'h-2.5' : 'h-3.5',
        )}
        role="img"
        aria-label={`Room status: ${available} available, ${occupied} occupied, ${maintenance} maintenance`}
      >
        {safeTotal === 0 ? (
          <div className="h-full w-full bg-neutral-100" />
        ) : (
          segments.map((seg) => {
            if (seg.count <= 0) return null
            const pct = (seg.count / safeTotal) * 100
            return (
              <div
                key={seg.key}
                className={cn(
                  'h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full',
                  seg.color,
                )}
                style={{ width: `${pct}%` }}
                title={`${seg.label}: ${seg.count}`}
              />
            )
          })
        )}
      </div>

      <ul className={cn(compact ? 'space-y-1.5' : 'flex flex-wrap gap-x-5 gap-y-2')}>
        {segments.map((seg) => (
          <li
            key={seg.key}
            className={cn(
              'inline-flex items-center gap-2 text-neutral-600',
              compact ? 'w-full justify-between text-xs' : 'text-sm',
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className={cn('shrink-0 rounded-full', compact ? 'h-2 w-2' : 'h-2.5 w-2.5', seg.dot)}
                aria-hidden
              />
              <span className="truncate font-medium text-neutral-700">{seg.label}</span>
            </span>
            <span className="shrink-0 tabular-nums text-neutral-400">{seg.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const DONUT_COLORS = ['#0F1B3D', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B']

export function BookingsByRoomTypeDonut({
  items,
  compact = false,
}: {
  items: Array<{ roomTypeId: string; roomTypeName: string; bookings: number }>
  compact?: boolean
}) {
  const total = items.reduce((sum, i) => sum + i.bookings, 0)
  const data = items.map((item, index) => ({
    ...item,
    percent: bookingSharePercent(item.bookings, total),
    fill: DONUT_COLORS[index % DONUT_COLORS.length],
  }))

  if (total === 0) {
    return (
      <p className={cn('text-center text-neutral-400', compact ? 'py-6 text-xs' : 'py-10 text-sm')}>
        No bookings in this period.
      </p>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center',
        compact ? 'gap-3' : 'gap-6 sm:flex-row sm:items-stretch',
      )}
    >
      <div
        className={cn(
          'relative shrink-0',
          compact ? 'mx-auto h-36 w-36' : 'mx-auto h-48 w-48 sm:mx-0',
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="bookings"
              nameKey="roomTypeName"
              cx="50%"
              cy="50%"
              innerRadius={compact ? '58%' : '62%'}
              outerRadius={compact ? '84%' : '88%'}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.roomTypeId} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const row = payload[0].payload as (typeof data)[number]
                return (
                  <div className="rounded-xl border border-neutral-100 bg-white px-3.5 py-2.5 shadow-[0_8px_24px_rgba(15,27,61,0.12)]">
                    <p className="text-[11px] font-medium text-neutral-400">{row.roomTypeName}</p>
                    <p className="mt-0.5 text-sm font-semibold text-[#0F1B3D]">
                      {row.bookings.toLocaleString()} · {row.percent}%
                    </p>
                  </div>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p
            className={cn(
              'font-bold tabular-nums tracking-tight text-neutral-900',
              compact ? 'text-xl' : 'text-2xl',
            )}
          >
            {total.toLocaleString()}
          </p>
          <p
            className={cn(
              'font-medium uppercase leading-tight tracking-wide text-neutral-400',
              compact ? 'mt-0.5 max-w-[4.5rem] text-[9px]' : 'mt-0.5 max-w-[5.5rem] text-[10px]',
            )}
          >
            Total Bookings
          </p>
        </div>
      </div>

      <ul
        className={cn(
          'min-w-0 w-full',
          compact ? 'space-y-1.5' : 'flex-1 space-y-2.5 self-center',
        )}
      >
        {data.map((row) => (
          <li
            key={row.roomTypeId}
            className={cn(
              'flex items-center justify-between gap-2',
              compact ? 'text-xs' : 'gap-3 text-sm',
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className={cn('shrink-0 rounded-full', compact ? 'h-2 w-2' : 'h-2.5 w-2.5')}
                style={{ backgroundColor: row.fill }}
                aria-hidden
              />
              <span className="truncate font-medium text-neutral-700">{row.roomTypeName}</span>
            </span>
            <span className="shrink-0 tabular-nums text-neutral-500">
              {row.bookings.toLocaleString()}
              <span className={cn('text-neutral-400', compact ? 'ml-1.5' : 'ml-2')}>
                {row.percent}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function OverallRatingsWidget({
  avgRating,
  totalReviews,
}: {
  avgRating: number
  totalReviews: number
}) {
  const label = ratingQualitativeLabel(avgRating)
  const display = totalReviews > 0 ? avgRating.toFixed(1) : '—'

  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="flex items-end gap-3">
        <p className="text-5xl font-bold tracking-tight text-neutral-900">{display}</p>
        <div className="mb-1.5 flex items-center gap-1.5">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden />
          <span className="text-base font-semibold text-neutral-800">{label}</span>
        </div>
      </div>
      <p className="text-sm text-neutral-500">
        {totalReviews > 0
          ? `${totalReviews.toLocaleString()} verified review${totalReviews === 1 ? '' : 's'}`
          : 'No verified reviews yet'}
      </p>
      <div className="mt-auto flex gap-1" aria-hidden>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-4 w-4',
              totalReviews > 0 && star <= Math.round(avgRating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-neutral-100 text-neutral-200',
            )}
          />
        ))}
      </div>
    </div>
  )
}
