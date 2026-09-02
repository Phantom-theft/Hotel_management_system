import { useMemo } from 'react'
import { Link } from 'react-router-dom'
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
  BedDouble,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Percent,
  PlusCircle,
  Star,
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

  const totalBookingsCount = cancellations.data?.totalBookings ?? 0
  const cancelledCount = cancellations.data?.cancelledBookings ?? 0
  const activeBookingsCount = Math.max(0, totalBookingsCount - cancelledCount)

  // Hospitality core metrics: ADR & RevPAR
  const { adrFormatted, revparFormatted } = useMemo(() => {
    const totalRev = revenue.data?.totalRevenue ?? 0
    const occRate = (occupancy.data?.overallOccupancyRate ?? 0) / 100

    if (totalRev > 0 && activeBookingsCount > 0) {
      const adr = totalRev / activeBookingsCount
      const revpar = adr * occRate
      return {
        adrFormatted: `$${adr.toFixed(2)}`,
        revparFormatted: `$${revpar.toFixed(2)}`,
      }
    }
    return { adrFormatted: '—', revparFormatted: '—' }
  }, [revenue.data?.totalRevenue, occupancy.data?.overallOccupancyRate, activeBookingsCount])

  // Room status counts
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

  const occupancyGauge = useMemo(() => {
    const rate = occupancy.data?.overallOccupancyRate ?? 0
    return [{ name: 'Occupancy', value: rate, fill: CHART_GOLD }]
  }, [occupancy.data?.overallOccupancyRate])

  return (
    <div className="space-y-6">
      {/* Quick Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
        <div>
          <h2 className="font-display text-lg font-bold text-primary">Property Overview & Operations</h2>
          <p className="text-xs text-neutral-500">Live operational status and revenue performance</p>
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
          >
            <BedDouble className="h-4 w-4 text-neutral-500" />
            Room Matrix
          </Link>
          <Link
            to="/admin/promotions"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
          >
            <Percent className="h-4 w-4 text-neutral-500" />
            Promotions
          </Link>
          <Link
            to="/admin/reviews"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
          >
            <Star className="h-4 w-4 text-amber-500" />
            Reviews
          </Link>
        </div>
      </div>

      {/* Live Room & Operational Status Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-neutral-200/70 bg-white p-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            <BedDouble className="h-4 w-4 text-primary" />
            Total Rooms
          </div>
          <p className="mt-1.5 font-display text-2xl font-extrabold text-primary">
            {roomStats.total || occupancy.data?.totalRooms || '—'}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Ready / Available
          </div>
          <p className="mt-1.5 font-display text-2xl font-extrabold text-emerald-900">
            {roomStats.available}
          </p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-blue-800">
            <CalendarCheck className="h-4 w-4 text-blue-600" />
            Occupied
          </div>
          <p className="mt-1.5 font-display text-2xl font-extrabold text-blue-900">
            {roomStats.occupied}
          </p>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-800">
            <Wrench className="h-4 w-4 text-amber-600" />
            Maintenance
          </div>
          <p className="mt-1.5 font-display text-2xl font-extrabold text-amber-900">
            {roomStats.maintenance}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200/70 bg-white p-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-600">
            <Clock className="h-4 w-4 text-amber-600" />
            Today's Check-ins
          </div>
          <p className="mt-1.5 font-display text-2xl font-extrabold text-primary">
            {today.data?.checkIns.length ?? 0}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200/70 bg-white p-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-600">
            <CalendarDays className="h-4 w-4 text-neutral-500" />
            Today's Check-outs
          </div>
          <p className="mt-1.5 font-display text-2xl font-extrabold text-primary">
            {today.data?.checkOuts.length ?? 0}
          </p>
        </div>
      </div>

      {/* Main KPI Stat Cards */}
      {loading ? (
        <BookingListSkeleton count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminDashboardStatCard
            featured
            label="Total Revenue"
            value={
              revenue.data ? `$${revenue.data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'
            }
            hint={`${from} – ${to}`}
          />
          <AdminDashboardStatCard
            label="Occupancy Rate"
            value={
              occupancy.data ? `${occupancy.data.overallOccupancyRate.toFixed(1)}%` : '—'
            }
            hint={`${occupancy.data?.totalRooms ?? roomStats.total} inventory rooms`}
          />
          <AdminDashboardStatCard
            label="Average Daily Rate (ADR)"
            value={adrFormatted}
            hint="Avg revenue per booked reservation"
          />
          <AdminDashboardStatCard
            label="RevPAR"
            value={revparFormatted}
            hint="Revenue Per Available Room"
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <AdminDashboardCard
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
        </AdminDashboardCard>

        <AdminDashboardCard
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
        </AdminDashboardCard>
      </div>

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

