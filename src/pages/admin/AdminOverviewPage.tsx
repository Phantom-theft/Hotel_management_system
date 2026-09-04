import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowRight,
  CalendarCheck,
  CalendarMinus,
  ChartColumn,
  ChartPie,
  ChevronDown,
  Database,
  DoorOpen,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react'
import {
  getCancellationsReport,
  getOccupancyReport,
  getRevenueReport,
  getTodaysBookings,
  listAllRooms,
} from '../../api/hotel'
import { AdminBookingTable } from '../../components/admin/AdminBookingTable'
import { AdminDashboardCard, AdminDashboardStatCard } from '../../components/admin/AdminDashboardCards'
import { BookingListSkeleton } from '../../components/ui/Skeletons'
import { useAdminDashboardShell } from '../../contexts/admin/AdminDashboardShellContext'
import { computeAdr, computeRevpar, formatHospitalityCurrency } from '../../utils/hospitalityMetrics'

const CHART_PRIMARY = '#0F1B3D'
const CHART_MUTED = '#E5E7EB'

function pctChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

/** Compare second half of a series to the first half (period trend proxy). */
function seriesChange(values: number[]): number | null {
  if (values.length < 4) return null
  const mid = Math.floor(values.length / 2)
  const first = values.slice(0, mid)
  const second = values.slice(mid)
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
  return pctChange(avg(second), avg(first))
}

function ChartFilterButton({ label = 'This month' }: { label?: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50"
    >
      {label}
      <ChevronDown className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
    </button>
  )
}

function formatBarLabel(value: unknown) {
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n.toFixed(0)}`
}

export function AdminOverviewPage() {
  const { dateRange } = useAdminDashboardShell()
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
  const roomsQuery = useQuery({ queryKey: ['rooms-admin-all'], queryFn: listAllRooms })

  const loading = occupancy.isLoading || revenue.isLoading || cancellations.isLoading

  const { adrFormatted, revparFormatted, adrValue, revparValue } = useMemo(() => {
    const totalRev = revenue.data?.totalRevenue ?? 0
    const roomNightsSold = revenue.data?.roomNightsSold ?? 0
    const totalRooms = occupancy.data?.totalRooms ?? roomsQuery.data?.rooms?.length ?? 0
    const adr = computeAdr(totalRev, roomNightsSold)
    const revpar = computeRevpar(totalRev, totalRooms)

    return {
      adrFormatted: formatHospitalityCurrency(adr),
      revparFormatted: formatHospitalityCurrency(revpar),
      adrValue: adr,
      revparValue: revpar,
    }
  }, [
    revenue.data?.totalRevenue,
    revenue.data?.roomNightsSold,
    occupancy.data?.totalRooms,
    roomsQuery.data?.rooms?.length,
  ])

  const roomStats = useMemo(() => {
    const rooms = roomsQuery.data?.rooms ?? []
    const total = rooms.length
    const available = rooms.filter((r) => r.status === 'available').length
    const occupied = rooms.filter((r) => r.status === 'occupied').length
    const maintenance = rooms.filter((r) => r.status === 'maintenance').length
    return { total, available, occupied, maintenance }
  }, [roomsQuery.data?.rooms])

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

  const revenueSpark = useMemo(
    () => (revenue.data?.byPeriod ?? []).map((d) => ({ value: d.revenue })),
    [revenue.data?.byPeriod],
  )
  const occupancySpark = useMemo(
    () => (occupancy.data?.days ?? []).map((d) => ({ value: d.occupancyRate })),
    [occupancy.data?.days],
  )

  const revenueChange = useMemo(
    () => seriesChange((revenue.data?.byPeriod ?? []).map((d) => d.revenue)),
    [revenue.data?.byPeriod],
  )
  const occupancyChange = useMemo(
    () => seriesChange((occupancy.data?.days ?? []).map((d) => d.occupancyRate)),
    [occupancy.data?.days],
  )

  // ADR / RevPAR sparklines derived from daily revenue ÷ inventory proxies
  const adrSpark = useMemo(() => {
    const nights = revenue.data?.roomNightsSold ?? 0
    const days = revenue.data?.byPeriod ?? []
    if (!days.length || nights <= 0) return []
    const nightsPerDay = nights / days.length
    return days.map((d) => ({ value: nightsPerDay > 0 ? d.revenue / nightsPerDay : 0 }))
  }, [revenue.data?.byPeriod, revenue.data?.roomNightsSold])

  const revparSpark = useMemo(() => {
    const totalRooms = occupancy.data?.totalRooms ?? roomStats.total
    const divisor = totalRooms || 1
    return (revenue.data?.byPeriod ?? []).map((d) => ({
      value: d.revenue / divisor,
    }))
  }, [revenue.data?.byPeriod, occupancy.data?.totalRooms, roomStats.total])

  const adrChange = useMemo(() => seriesChange(adrSpark.map((d) => d.value)), [adrSpark])
  const revparChange = useMemo(() => seriesChange(revparSpark.map((d) => d.value)), [revparSpark])

  const occupancyRate = occupancy.data?.overallOccupancyRate ?? 0
  const totalRooms = roomStats.total || occupancy.data?.totalRooms || 0
  const barData = revenue.data?.byRoomType ?? []

  return (
    <div className="space-y-6">
      {loading ? (
        <BookingListSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminDashboardStatCard
            label="Total Revenue"
            value={
              revenue.data
                ? `$${revenue.data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—'
            }
            icon={Wallet}
            iconClassName="bg-blue-50 text-blue-600"
            change={revenueChange}
            sparklineData={revenueSpark}
            sparklineColor="#3B82F6"
          />
          <AdminDashboardStatCard
            label="Occupancy"
            value={occupancy.data ? `${occupancy.data.overallOccupancyRate.toFixed(1)}%` : '—'}
            icon={ChartPie}
            iconClassName="bg-emerald-50 text-emerald-600"
            change={occupancyChange}
            sparklineData={occupancySpark}
            sparklineColor="#10B981"
          />
          <AdminDashboardStatCard
            label="ADR"
            value={adrFormatted}
            icon={ChartColumn}
            iconClassName="bg-orange-50 text-orange-600"
            change={adrValue != null ? adrChange : null}
            sparklineData={adrSpark}
            sparklineColor="#F97316"
          />
          <AdminDashboardStatCard
            label="RevPAR"
            value={revparFormatted}
            icon={Database}
            iconClassName="bg-purple-50 text-purple-600"
            change={revparValue != null ? revparChange : null}
            sparklineData={revparSpark}
            sparklineColor="#A855F7"
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
        <AdminDashboardCard
          title="Live status"
          headerRight={
            <span className="inline-flex items-center gap-2 text-xs font-medium text-neutral-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Real-time updates
            </span>
          }
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
            <StatusMetric
              label="Total rooms"
              value={totalRooms || '—'}
              caption="In system"
              icon={<Users className="h-4 w-4" />}
              badgeClass="bg-blue-50 text-blue-600"
            />
            <StatusMetric
              label="Available"
              value={roomStats.available}
              caption={totalRooms ? `${Math.round((roomStats.available / totalRooms) * 100)}% of total` : 'Ready'}
              icon={<DoorOpen className="h-4 w-4" />}
              badgeClass="bg-emerald-50 text-emerald-600"
            />
            <StatusMetric
              label="Occupied"
              value={roomStats.occupied}
              caption={totalRooms ? `${Math.round((roomStats.occupied / totalRooms) * 100)}% of total` : 'In use'}
              icon={<Users className="h-4 w-4" />}
              badgeClass="bg-indigo-50 text-indigo-600"
            />
            <StatusMetric
              label="Maintenance"
              value={roomStats.maintenance}
              caption="Out of service"
              icon={<Wrench className="h-4 w-4" />}
              badgeClass="bg-orange-50 text-orange-600"
            />
            <StatusMetric
              label="Check-ins today"
              value={today.data?.checkIns.length ?? 0}
              caption="Arrivals"
              icon={<CalendarCheck className="h-4 w-4" />}
              badgeClass="bg-sky-50 text-sky-600"
            />
            <StatusMetric
              label="Check-outs today"
              value={today.data?.checkOuts.length ?? 0}
              caption="Departures"
              icon={<CalendarMinus className="h-4 w-4" />}
              badgeClass="bg-violet-50 text-violet-600"
            />
          </div>
        </AdminDashboardCard>

        <AdminDashboardCard
          title="Occupancy"
          headerRight={
            <Link
              to="/admin/reports"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#0F1B3D] transition hover:underline"
            >
              View details
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          }
        >
          <p className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            {occupancy.data ? `${occupancyRate.toFixed(1)}%` : '—'}
          </p>
          <div className="mt-6">
            <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-[#0F1B3D] transition-all duration-500"
                style={{ width: `${Math.min(occupancyRate, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-neutral-400">
              <span>0%</span>
              <span>100%</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
              <span>{roomStats.occupied} occupied rooms</span>
              <span>{roomStats.available} available rooms</span>
            </div>
          </div>
        </AdminDashboardCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminDashboardCard
          title="Revenue by room type"
          description={
            revenue.data
              ? `$${revenue.data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total revenue`
              : undefined
          }
          headerRight={<ChartFilterButton />}
        >
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barCategoryGap="28%" margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={CHART_MUTED} strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="roomTypeName"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Revenue']}
                  contentStyle={{
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 24px rgb(15 27 61 / 0.1)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="revenue" name="Revenue" fill={CHART_PRIMARY} radius={[6, 6, 0, 0]} maxBarSize={48}>
                  <LabelList
                    dataKey="revenue"
                    position="top"
                    formatter={formatBarLabel}
                    style={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminDashboardCard>

        <AdminDashboardCard title="Occupancy trend" headerRight={<ChartFilterButton />}>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={occupancy.data?.days ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="occupancyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_PRIMARY} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={CHART_PRIMARY} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART_MUTED} strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  unit="%"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  width={40}
                />
                <Tooltip
                  formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Occupancy']}
                  contentStyle={{
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 24px rgb(15 27 61 / 0.1)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="occupancyRate"
                  name="Occupancy"
                  stroke={CHART_PRIMARY}
                  strokeWidth={2}
                  fill="url(#occupancyFill)"
                  fillOpacity={1}
                  dot={false}
                  activeDot={{ r: 4, fill: CHART_PRIMARY }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminDashboardCard>
      </div>

      <AdminDashboardCard
        title="Today's arrivals & departures"
        description={
          today.data
            ? `${today.data.checkIns.length} arrivals • ${today.data.checkOuts.length} departures`
            : undefined
        }
        headerRight={
          <Link
            to="/admin/bookings"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#0F1B3D] transition hover:underline"
          >
            View all bookings
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        }
      >
        {today.isLoading ? (
          <BookingListSkeleton count={3} />
        ) : (
          <AdminBookingTable bookings={recentBookings} emptyMessage="No activity today." />
        )}
      </AdminDashboardCard>
    </div>
  )
}

function StatusMetric({
  label,
  value,
  caption,
  icon,
  badgeClass,
}: {
  label: string
  value: number | string
  caption: string
  icon: ReactNode
  badgeClass: string
}) {
  return (
    <div className="rounded-xl bg-[#F8F9FC] p-3.5 sm:p-4">
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${badgeClass}`}>{icon}</div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">{label}</p>
      </div>
      <p className="mt-2.5 text-2xl font-bold tracking-tight text-neutral-900">{value}</p>
      <p className="mt-0.5 text-xs text-neutral-400">{caption}</p>
    </div>
  )
}
