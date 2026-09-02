import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  getCancellationsReport,
  getOccupancyReport,
  getRevenueReport,
  getTodaysBookings,
} from '../../api/hotel'
import { BookingTable } from '../../components/dashboard/BookingTable'
import { DashboardCard, DashboardStatCard } from '../../components/dashboard/DashboardCards'
import { BookingListSkeleton } from '../../components/Skeletons'
import { useDashboardShell } from '../../contexts/DashboardShellContext'

const CHART_NAVY = '#0F1E3C'
const CHART_GOLD = '#C9A227'

export function AdminOverviewPage() {
  const { dateRange } = useDashboardShell()
  const { from, to } = dateRange

  const occupancy = useQuery({
    queryKey: ['report-occupancy', from, to],
    queryFn: () => getOccupancyReport(from, to),
  })
  const revenue = useQuery({
    queryKey: ['report-revenue', from, to],
    queryFn: () => getRevenueReport(from, to),
  })
  const cancellations = useQuery({
    queryKey: ['report-cancellations', from, to],
    queryFn: () => getCancellationsReport(from, to),
  })
  const today = useQuery({ queryKey: ['bookings-today'], queryFn: getTodaysBookings })

  const loading = occupancy.isLoading || revenue.isLoading || cancellations.isLoading

  const activeBookings = useMemo(() => {
    if (!cancellations.data) return '—'
    const active = cancellations.data.totalBookings - cancellations.data.cancelledBookings
    return String(active)
  }, [cancellations.data])

  const recentBookings = useMemo(() => {
    const checkIns = today.data?.checkIns ?? []
    const checkOuts = today.data?.checkOuts ?? []
    const seen = new Set<string>()
    const merged = [...checkIns, ...checkOuts].filter((b) => {
      if (seen.has(b.id)) return false
      seen.add(b.id)
      return true
    })
    return merged.slice(0, 8)
  }, [today.data])

  const occupancyGauge = useMemo(() => {
    const rate = occupancy.data?.overallOccupancyRate ?? 0
    return [{ name: 'Occupancy', value: rate, fill: CHART_GOLD }]
  }, [occupancy.data?.overallOccupancyRate])

  return (
    <div className="space-y-6">
      {loading ? (
        <BookingListSkeleton count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            featured
            label="Total revenue"
            value={
              revenue.data ? `$${revenue.data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'
            }
            hint={`${from} – ${to}`}
          />
          <DashboardStatCard
            label="Occupancy rate"
            value={
              occupancy.data ? `${occupancy.data.overallOccupancyRate.toFixed(1)}%` : '—'
            }
            hint={`${occupancy.data?.totalRooms ?? 0} rooms`}
          />
          <DashboardStatCard
            label="Active bookings"
            value={activeBookings}
            hint="Excludes cancelled in range"
          />
          <DashboardStatCard
            label="Total rooms"
            value={occupancy.data ? String(occupancy.data.totalRooms) : '—'}
            hint="Property inventory"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardCard
          title="Revenue by room type"
          description={
            revenue.data
              ? `Paid payments · $${revenue.data.totalRevenue.toFixed(2)} total`
              : 'Revenue breakdown for selected range'
          }
          className="lg:col-span-2"
        >
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue.data?.byRoomType ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="roomTypeName" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Revenue']} />
                <Bar dataKey="revenue" name="Revenue" fill={CHART_NAVY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Occupancy snapshot"
          description={
            occupancy.data
              ? `${occupancy.data.overallOccupancyRate.toFixed(1)}% overall`
              : 'Current period occupancy'
          }
        >
          <div className="relative mx-auto h-48 w-full max-w-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="70%"
                outerRadius="100%"
                barSize={14}
                data={occupancyGauge}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar background={{ fill: '#f5f5f4' }} dataKey="value" cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-extrabold text-primary">
                {occupancy.data ? `${occupancy.data.overallOccupancyRate.toFixed(0)}%` : '—'}
              </span>
              <span className="text-xs text-neutral-500">occupied</span>
            </div>
          </div>
        </DashboardCard>
      </div>

      <DashboardCard
        title="Occupancy trend"
        description="Daily occupancy rate over the selected range"
      >
        <div className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={occupancy.data?.days ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="occupancyRate"
                name="Occupancy %"
                stroke={CHART_GOLD}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </DashboardCard>

      <DashboardCard
        title="Today's activity"
        description={
          today.data
            ? `${today.data.checkIns.length} check-ins · ${today.data.checkOuts.length} check-outs`
            : 'Arrivals and departures for today'
        }
      >
        {today.isLoading ? (
          <BookingListSkeleton count={3} />
        ) : (
          <BookingTable bookings={recentBookings} emptyMessage="No arrivals or departures today." />
        )}
      </DashboardCard>
    </div>
  )
}
