import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BedDouble,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Percent,
  PlusCircle,
  Star,
  TrendingUp,
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
import { AdminDateRangePicker } from '../../components/admin/AdminDateRangePicker'
import { BookingListSkeleton } from '../../components/ui/Skeletons'
import { useAdminDashboardShell } from '../../contexts/admin/AdminDashboardShellContext'
import { computeAdr, computeRevpar, formatHospitalityCurrency } from '../../utils/hospitalityMetrics'

const CHART_NAVY = '#0F1E3C'
const CHART_GOLD = '#C9A227'

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

  const { adrFormatted, revparFormatted } = useMemo(() => {
    const totalRev = revenue.data?.totalRevenue ?? 0
    const roomNightsSold = revenue.data?.roomNightsSold ?? 0
    const totalRooms = occupancy.data?.totalRooms ?? roomsQuery.data?.rooms?.length ?? 0

    return {
      adrFormatted: formatHospitalityCurrency(computeAdr(totalRev, roomNightsSold)),
      revparFormatted: formatHospitalityCurrency(computeRevpar(totalRev, totalRooms)),
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

  const occupancyRate = occupancy.data?.overallOccupancyRate ?? 0
  const totalRooms = roomStats.total || occupancy.data?.totalRooms || 0

  return (
    <div className="space-y-8">
      {/* Page header + quick actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-primary sm:text-2xl">
            Property Overview
          </h2>
          <p className="mt-1 text-sm text-neutral-500">Live operations and revenue performance</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/bookings"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-light"
          >
            <PlusCircle className="h-4 w-4" />
            New Walk-in
          </Link>
          <Link
            to="/admin/rooms"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            <BedDouble className="h-4 w-4 text-neutral-500" />
            Rooms
          </Link>
          <Link
            to="/admin/promotions"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            <Percent className="h-4 w-4 text-neutral-500" />
            Promotions
          </Link>
          <Link
            to="/admin/reviews"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            <Star className="h-4 w-4 text-amber-500" />
            Reviews
          </Link>
          <div className="hidden h-6 w-px bg-neutral-200 sm:block" aria-hidden />
          <AdminDateRangePicker />
        </div>
      </div>

      {/* Revenue KPIs */}
      {loading ? (
        <BookingListSkeleton count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminDashboardStatCard
            featured
            label="Total Revenue"
            value={
              revenue.data
                ? `$${revenue.data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—'
            }
            hint="Revenue for selected period"
          />
          <AdminDashboardStatCard
            label="Occupancy Rate"
            value={occupancy.data ? `${occupancy.data.overallOccupancyRate.toFixed(1)}%` : '—'}
            hint={`${totalRooms} inventory rooms`}
          />
          <AdminDashboardStatCard
            label="Average Daily Rate (ADR)"
            value={adrFormatted}
            hint="Avg revenue per room-night sold"
          />
          <AdminDashboardStatCard
            label="RevPAR"
            value={revparFormatted}
            hint="Total revenue ÷ room inventory"
          />
        </div>
      )}

      {/* Live status + occupancy snapshot */}
      <div className="grid gap-6 lg:grid-cols-3">
        <AdminDashboardCard
          title="Live room status"
          description="Real-time floor inventory"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-neutral-100 bg-neutral-100 sm:grid-cols-3">
            <RoomStatusCell
              icon={<BedDouble className="h-4 w-4 text-primary" />}
              label="Total Rooms"
              value={totalRooms || '—'}
              tone="neutral"
            />
            <RoomStatusCell
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              label="Available"
              value={roomStats.available}
              tone="emerald"
            />
            <RoomStatusCell
              icon={<CalendarCheck className="h-4 w-4 text-blue-600" />}
              label="Occupied"
              value={roomStats.occupied}
              tone="blue"
            />
            <RoomStatusCell
              icon={<Wrench className="h-4 w-4 text-amber-600" />}
              label="Maintenance"
              value={roomStats.maintenance}
              tone="amber"
            />
            <RoomStatusCell
              icon={<Clock className="h-4 w-4 text-primary" />}
              label="Check-ins Today"
              value={today.data?.checkIns.length ?? 0}
              tone="neutral"
            />
            <RoomStatusCell
              icon={<CalendarDays className="h-4 w-4 text-neutral-500" />}
              label="Check-outs Today"
              value={today.data?.checkOuts.length ?? 0}
              tone="neutral"
            />
          </div>
        </AdminDashboardCard>

        <div className="overflow-hidden rounded-xl border border-neutral-100 bg-gradient-to-br from-primary via-primary to-primary-light p-5 text-white shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-white/70">Occupancy snapshot</p>
              <p className="mt-3 font-display text-4xl font-extrabold tracking-tight">
                {occupancy.data ? `${occupancyRate.toFixed(1)}%` : '—'}
              </p>
              <p className="mt-1 text-xs text-white/60">Period average</p>
            </div>
            <div className="rounded-lg bg-white/10 p-2">
              <TrendingUp className="h-5 w-5 text-amber-300" />
            </div>
          </div>

          <div className="mt-5">
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-400 transition-all duration-500"
                style={{ width: `${Math.min(occupancyRate, 100)}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-white/70">
              <span>0%</span>
              <span>{totalRooms} rooms in inventory</span>
              <span>100%</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
            <div className="text-center">
              <p className="font-display text-lg font-bold">{roomStats.occupied}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/60">Occupied</p>
            </div>
            <div className="border-x border-white/10 text-center">
              <p className="font-display text-lg font-bold">{roomStats.available}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/60">Available</p>
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-bold">{roomStats.maintenance}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/60">Maint.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminDashboardCard
          title="Revenue by room type"
          description={
            revenue.data
              ? `Paid payments · $${revenue.data.totalRevenue.toFixed(2)} total`
              : 'Revenue breakdown for selected range'
          }
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
        </AdminDashboardCard>

        <AdminDashboardCard
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
        </AdminDashboardCard>
      </div>

      <AdminDashboardCard
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
          <AdminBookingTable bookings={recentBookings} emptyMessage="No arrivals or departures today." />
        )}
      </AdminDashboardCard>
    </div>
  )
}

function RoomStatusCell({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode
  label: string
  value: number | string
  tone: 'neutral' | 'emerald' | 'blue' | 'amber'
}) {
  const valueColor = {
    neutral: 'text-primary',
    emerald: 'text-emerald-900',
    blue: 'text-blue-900',
    amber: 'text-amber-900',
  }[tone]

  return (
    <div className="flex flex-col bg-white px-4 py-4">
      <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
        {icon}
        {label}
      </div>
      <p className={`mt-2 font-display text-2xl font-extrabold ${valueColor}`}>{value}</p>
    </div>
  )
}
