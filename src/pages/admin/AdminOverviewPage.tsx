import { useMemo } from 'react'
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

const CHART_PRIMARY = '#0F1E3C'
const CHART_MUTED = '#d6d3d1'

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
    <div className="space-y-10">
      {loading ? (
        <BookingListSkeleton count={4} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminDashboardStatCard
            featured
            label="Total Revenue"
            value={
              revenue.data
                ? `$${revenue.data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—'
            }
            hint="Selected period"
          />
          <AdminDashboardStatCard
            label="Occupancy"
            value={occupancy.data ? `${occupancy.data.overallOccupancyRate.toFixed(1)}%` : '—'}
            hint={`${totalRooms} rooms`}
          />
          <AdminDashboardStatCard label="ADR" value={adrFormatted} hint="Per room-night sold" />
          <AdminDashboardStatCard label="RevPAR" value={revparFormatted} hint="Per room in inventory" />
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <AdminDashboardCard title="Live status" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-y-6 gap-x-4 sm:grid-cols-3">
            <StatusMetric label="Total rooms" value={totalRooms || '—'} />
            <StatusMetric label="Available" value={roomStats.available} accent="emerald" />
            <StatusMetric label="Occupied" value={roomStats.occupied} accent="blue" />
            <StatusMetric label="Maintenance" value={roomStats.maintenance} accent="amber" />
            <StatusMetric label="Check-ins today" value={today.data?.checkIns.length ?? 0} />
            <StatusMetric label="Check-outs today" value={today.data?.checkOuts.length ?? 0} />
          </div>
        </AdminDashboardCard>

        <div className="rounded-2xl border border-neutral-200/70 bg-white p-5 sm:p-6">
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">Occupancy</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-neutral-900">
            {occupancy.data ? `${occupancyRate.toFixed(1)}%` : '—'}
          </p>
          <div className="mt-5 h-1 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(occupancyRate, 100)}%` }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">
            <span>{roomStats.occupied} occupied</span>
            <span>{roomStats.available} available</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <AdminDashboardCard
          title="Revenue by room type"
          description={
            revenue.data ? `$${revenue.data.totalRevenue.toFixed(2)} total` : undefined
          }
        >
          <div className="h-52 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue.data?.byRoomType ?? []} barCategoryGap="20%">
                <CartesianGrid stroke={CHART_MUTED} strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="roomTypeName"
                  tick={{ fontSize: 11, fill: '#a8a29e' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#a8a29e' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Revenue']}
                  contentStyle={{
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 24px rgb(0 0 0 / 0.08)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="revenue" name="Revenue" fill={CHART_PRIMARY} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminDashboardCard>

        <AdminDashboardCard title="Occupancy trend">
          <div className="h-52 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={occupancy.data?.days ?? []}>
                <CartesianGrid stroke={CHART_MUTED} strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#a8a29e' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  unit="%"
                  tick={{ fontSize: 11, fill: '#a8a29e' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 24px rgb(0 0 0 / 0.08)',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="occupancyRate"
                  name="Occupancy"
                  stroke={CHART_PRIMARY}
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AdminDashboardCard>
      </div>

      <AdminDashboardCard
        title="Today"
        description={
          today.data
            ? `${today.data.checkIns.length} arrivals · ${today.data.checkOuts.length} departures`
            : undefined
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
  accent,
}: {
  label: string
  value: number | string
  accent?: 'emerald' | 'blue' | 'amber'
}) {
  const dotColor = accent
    ? { emerald: 'bg-emerald-400', blue: 'bg-blue-400', amber: 'bg-amber-400' }[accent]
    : undefined

  return (
    <div>
      <div className="flex items-center gap-1.5">
        {accent && <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />}
        <p className="text-xs text-neutral-400">{label}</p>
      </div>
      <p className="mt-1 text-xl font-semibold text-neutral-900">{value}</p>
    </div>
  )
}
