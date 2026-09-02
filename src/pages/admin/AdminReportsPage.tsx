import { useMemo, useState } from 'react'
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
import { Download } from 'lucide-react'
import { getCancellationsReport, getOccupancyReport, getRevenueReport } from '../../api/hotel'
import { BookingListSkeleton } from '../../components/ui/Skeletons'

function getPresetRange(preset: 'today' | '7d' | '30d' | 'mtd' | 'ytd') {
  const now = new Date()
  const to = now.toISOString().slice(0, 10)
  const fromDate = new Date(now)

  if (preset === 'today') {
    return { from: to, to }
  } else if (preset === '7d') {
    fromDate.setDate(now.getDate() - 7)
  } else if (preset === '30d') {
    fromDate.setDate(now.getDate() - 30)
  } else if (preset === 'mtd') {
    fromDate.setDate(1)
  } else if (preset === 'ytd') {
    fromDate.setMonth(0, 1)
  }

  return {
    from: fromDate.toISOString().slice(0, 10),
    to,
  }
}

export function AdminReportsPage() {
  const initial = useMemo(() => getPresetRange('30d'), [])
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [activePreset, setActivePreset] = useState<'today' | '7d' | '30d' | 'mtd' | 'ytd' | 'custom'>('30d')

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

  const loading = occupancy.isLoading || revenue.isLoading || cancellations.isLoading

  function applyPreset(preset: 'today' | '7d' | '30d' | 'mtd' | 'ytd') {
    const range = getPresetRange(preset)
    setActivePreset(preset)
    setFrom(range.from)
    setTo(range.to)
  }

  function handleExportCSV() {
    if (!revenue.data && !occupancy.data) return

    const rows: string[] = ['Report Category,Date/Key,Metric 1,Metric 2']

    // Add Revenue rows
    rows.push('--- REVENUE BY ROOM TYPE ---')
    revenue.data?.byRoomType.forEach((r) => {
      rows.push(`Room Type Revenue,${r.roomTypeName},${r.revenue.toFixed(2)},USD`)
    })

    // Add Occupancy rows
    rows.push('--- DAILY OCCUPANCY ---')
    rows.push('Date,Occupied Rooms,Total Rooms,Occupancy Rate (%)')
    occupancy.data?.days.forEach((d) => {
      rows.push(`${d.date},${d.occupiedRooms},${d.totalRooms},${d.occupancyRate.toFixed(1)}%`)
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `harborlight-report-${from}-to-${to}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-8">
      {/* Date Controls & Preset Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mr-1">Presets:</span>
          {(
            [
              { id: 'today', label: 'Today' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'mtd', label: 'This Month' },
              { id: 'ytd', label: 'Year to Date' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activePreset === p.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                setActivePreset('custom')
              }}
              className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700"
            />
            <span className="text-neutral-400 font-medium">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                setActivePreset('custom')
              }}
              className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-1.5 text-xs font-semibold text-neutral-700 shadow-xs transition hover:bg-neutral-100 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 text-neutral-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Scorecards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Period Revenue</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-primary">
            {revenue.data ? `$${revenue.data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">Completed payments</p>
        </div>

        <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Avg Occupancy</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-primary">
            {occupancy.data ? `${occupancy.data.overallOccupancyRate.toFixed(1)}%` : '—'}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">{occupancy.data?.totalRooms ?? 0} total rooms</p>
        </div>

        <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Bookings</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-primary">
            {cancellations.data ? cancellations.data.totalBookings : '—'}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">In selected period</p>
        </div>

        <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Cancellation Rate</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-rose-600">
            {cancellations.data ? `${cancellations.data.cancellationRate.toFixed(1)}%` : '—'}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">{cancellations.data?.cancelledBookings ?? 0} cancelled</p>
        </div>
      </div>

      {loading && <BookingListSkeleton count={3} />}

      {/* Occupancy Rate Chart */}
      <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-bold text-primary">Occupancy Rate Trend</h2>
        <p className="mb-4 text-xs text-neutral-500">
          {occupancy.data
            ? `Overall ${occupancy.data.overallOccupancyRate.toFixed(1)}% across ${occupancy.data.totalRooms} rooms`
            : 'Daily occupancy over the selected range'}
        </p>
        <div className="h-60 sm:h-68">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={occupancy.data?.days ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Occupancy']} />
              <Line
                type="monotone"
                dataKey="occupancyRate"
                name="Occupancy %"
                stroke="#0f766e"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Revenue by Room Type Chart */}
      <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-bold text-primary">Revenue by Room Type</h2>
        <p className="mb-4 text-xs text-neutral-500">
          Breakdown of earned room revenues
          {revenue.data ? ` · Total $${revenue.data.totalRevenue.toFixed(2)}` : ''}
        </p>
        <div className="h-60 sm:h-68">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenue.data?.byRoomType ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="roomTypeName" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Revenue']} />
              <Bar dataKey="revenue" name="Revenue" fill="#0F1E3C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Cancellation Rate Chart */}
      <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-bold text-primary">Cancellation Rate</h2>
        <p className="mb-4 text-xs text-neutral-500">
          {cancellations.data
            ? `Overall ${cancellations.data.cancellationRate.toFixed(1)}% · ${cancellations.data.cancelledBookings} of ${cancellations.data.totalBookings} reservations`
            : 'Share of bookings cancelled over time'}
        </p>
        <div className="h-60 sm:h-68">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cancellations.data?.byPeriod ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Cancellation Rate']} />
              <Line
                type="monotone"
                dataKey="cancellationRate"
                name="Cancel %"
                stroke="#be123c"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}

