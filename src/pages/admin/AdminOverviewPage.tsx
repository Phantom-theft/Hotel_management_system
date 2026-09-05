import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowRight,
  BookPlus,
  ChevronDown,
  LogIn,
  LogOut,
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
import {
  AdminChartTooltip,
  BookingsByRoomTypeDonut,
  RoomOccupancyWidget,
} from '../../components/admin/AdminDashboardCharts'
import { AdminDashboardCard, AdminDashboardStatCard } from '../../components/admin/AdminDashboardCards'
import { BookingListSkeleton } from '../../components/ui/Skeletons'
import { useAdminDashboardShell } from '../../contexts/admin/AdminDashboardShellContext'
import { previousPeriodChangeSuffix } from '../../utils/periodTrends'

const CHART_PRIMARY = '#0F1B3D'
const CHART_ACCENT = '#3B82F6'
const CHART_MUTED = '#E5E7EB'

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

function formatCurrency(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
  const changeSuffix = previousPeriodChangeSuffix(from, to)

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

  const barData = revenue.data?.byRoomType ?? []

  return (
    <div className="space-y-6">
      {loading ? (
        <BookingListSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <AdminDashboardStatCard
            label="Total Revenue"
            value={
              revenue.data
                ? `$${revenue.data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—'
            }
            icon={Wallet}
            iconClassName="bg-blue-50 text-blue-600"
            change={revenue.data?.changes.totalRevenuePercent ?? null}
            changeSuffix={changeSuffix}
            sparklineData={(revenue.data?.byPeriod ?? []).map((d) => ({ value: d.revenue }))}
            sparklineColor="#3B82F6"
            hint="No prior-period baseline"
          />
          <AdminDashboardStatCard
            label="New Bookings"
            value={revenue.data ? String(revenue.data.newBookings) : '—'}
            icon={BookPlus}
            iconClassName="bg-emerald-50 text-emerald-600"
            change={revenue.data?.changes.newBookingsPercent ?? null}
            changeSuffix={changeSuffix}
            hint="No prior-period baseline"
          />
          <AdminDashboardStatCard
            label="Check-ins"
            value={revenue.data ? String(revenue.data.checkIns) : '—'}
            icon={LogIn}
            iconClassName="bg-orange-50 text-orange-600"
            change={revenue.data?.changes.checkInsPercent ?? null}
            changeSuffix={changeSuffix}
            hint="No prior-period baseline"
          />
          <AdminDashboardStatCard
            label="Check-outs"
            value={revenue.data ? String(revenue.data.checkOuts) : '—'}
            icon={LogOut}
            iconClassName="bg-purple-50 text-purple-600"
            change={revenue.data?.changes.checkOutsPercent ?? null}
            changeSuffix={changeSuffix}
            hint="No prior-period baseline"
          />
          <AdminDashboardStatCard
            label="Maintenance"
            value={roomsQuery.isLoading ? '—' : String(roomStats.maintenance)}
            icon={Wrench}
            iconClassName="bg-orange-50 text-orange-600"
            hint="Rooms out of service"
          />
        </div>
      )}

      {/* Row 2: Revenue by room type | Occupancy trend | Room Occupancy */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.55fr)]">
          <AdminDashboardCard
            title="Revenue by room type"
            description={
              revenue.data
                ? `${formatCurrency(revenue.data.totalRevenue)} total revenue`
                : undefined
            }
            headerRight={<ChartFilterButton />}
          >
            <div className="h-52 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={barData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueAreaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_ACCENT} stopOpacity={0.35} />
                      <stop offset="55%" stopColor={CHART_ACCENT} stopOpacity={0.12} />
                      <stop offset="100%" stopColor={CHART_ACCENT} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART_MUTED} strokeDasharray="0" vertical={false} />
                  <XAxis
                    dataKey="roomTypeName"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
                  />
                  <Tooltip
                    cursor={{ stroke: CHART_ACCENT, strokeWidth: 1, strokeDasharray: '4 4' }}
                    content={
                      <AdminChartTooltip
                        valueFormatter={(v) => formatCurrency(v)}
                        labelFormatter={(l) => String(l ?? '')}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke={CHART_ACCENT}
                    strokeWidth={2.5}
                    fill="url(#revenueAreaFill)"
                    fillOpacity={1}
                    dot={{ r: 3, fill: CHART_ACCENT, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: CHART_ACCENT, stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </AdminDashboardCard>

          <AdminDashboardCard title="Occupancy trend" headerRight={<ChartFilterButton />}>
            <div className="h-52 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={occupancy.data?.days ?? []}
                  margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="occupancyAreaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_PRIMARY} stopOpacity={0.32} />
                      <stop offset="55%" stopColor={CHART_PRIMARY} stopOpacity={0.1} />
                      <stop offset="100%" stopColor={CHART_PRIMARY} stopOpacity={0} />
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
                    cursor={{ stroke: CHART_PRIMARY, strokeWidth: 1, strokeDasharray: '4 4' }}
                    content={
                      <AdminChartTooltip
                        valueFormatter={(v) => `${v.toFixed(1)}%`}
                        labelFormatter={(l) => String(l ?? '')}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="occupancyRate"
                    name="Occupancy"
                    stroke={CHART_PRIMARY}
                    strokeWidth={2.5}
                    fill="url(#occupancyAreaFill)"
                    fillOpacity={1}
                    dot={false}
                    activeDot={{ r: 5, fill: CHART_PRIMARY, stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </AdminDashboardCard>

          <AdminDashboardCard
            dense
            title="Room Occupancy"
            description="Live room status"
            headerRight={
              <Link
                to="/admin/rooms"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F1B3D] transition hover:underline"
              >
                Manage
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            }
          >
            <RoomOccupancyWidget
              compact
              total={roomStats.total}
              available={roomStats.available}
              occupied={roomStats.occupied}
              maintenance={roomStats.maintenance}
            />
          </AdminDashboardCard>
      </div>

      {/* Row 3: Today's arrivals & departures (left) | Bookings by Room Type (right) */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.38fr)]">
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

        <AdminDashboardCard
          dense
          title="Bookings by Room Type"
          description="Selected period share"
        >
          <BookingsByRoomTypeDonut compact items={revenue.data?.bookingsByRoomType ?? []} />
        </AdminDashboardCard>
      </div>
    </div>
  )
}
