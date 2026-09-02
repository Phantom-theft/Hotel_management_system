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
import { getCancellationsReport, getOccupancyReport, getRevenueReport } from '../../api/hotel'
import { BookingListSkeleton } from '../../components/ui/Skeletons'

function defaultRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - 30)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

export function AdminReportsPage() {
  const initial = useMemo(() => defaultRange(), [])
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)

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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-100 bg-white p-4 shadow-card">
        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>
        <p className="text-sm text-neutral-500">
          Filters occupancy, revenue (paid payments), and cancellations.
        </p>
      </div>

      {loading && <BookingListSkeleton count={3} />}

      <section className="rounded-xl border border-neutral-100 bg-white p-4 shadow-card">
        <h2 className="mb-1 font-display text-xl">Occupancy rate</h2>
        <p className="mb-4 text-sm text-neutral-500">
          {occupancy.data
            ? `Overall ${occupancy.data.overallOccupancyRate.toFixed(1)}% across ${occupancy.data.totalRooms} rooms`
            : 'Daily occupancy over the selected range'}
        </p>
        <div className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={occupancy.data?.days ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis unit="%" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="occupancyRate"
                name="Occupancy %"
                stroke="#0f766e"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-100 bg-white p-4 shadow-card">
        <h2 className="mb-1 font-display text-xl">Revenue by room type</h2>
        <p className="mb-4 text-sm text-neutral-500">
          Based on completed Payment records
          {revenue.data ? ` · total $${revenue.data.totalRevenue.toFixed(2)}` : ''}
        </p>
        <div className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenue.data?.byRoomType ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="roomTypeName" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Revenue']} />
              <Bar dataKey="revenue" name="Revenue" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-100 bg-white p-4 shadow-card">
        <h2 className="mb-1 font-display text-xl">Cancellation rate</h2>
        <p className="mb-4 text-sm text-neutral-500">
          {cancellations.data
            ? `Overall ${cancellations.data.cancellationRate.toFixed(1)}% · ${cancellations.data.cancelledBookings} / ${cancellations.data.totalBookings} bookings`
            : 'Share of bookings cancelled over time'}
        </p>
        <div className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cancellations.data?.byPeriod ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis unit="%" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="cancellationRate"
                name="Cancel %"
                stroke="#be123c"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
