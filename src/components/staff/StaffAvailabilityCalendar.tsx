import { useMemo } from 'react'

interface AvailabilityCalendarProps {
  /** ISO date strings (YYYY-MM-DD) that are booked / unavailable */
  bookedDates: string[]
  month?: Date
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export function StaffAvailabilityCalendar({ bookedDates, month }: AvailabilityCalendarProps) {
  const view = month ?? new Date()
  const year = view.getFullYear()
  const monthIndex = view.getMonth()
  const booked = useMemo(() => new Set(bookedDates), [bookedDates])

  const firstDow = new Date(year, monthIndex, 1).getDay()
  const total = daysInMonth(year, monthIndex)
  const cells: Array<{ day: number | null; key: string; booked: boolean }> = []

  for (let i = 0; i < firstDow; i++) {
    cells.push({ day: null, key: `e-${i}`, booked: false })
  }
  for (let day = 1; day <= total; day++) {
    const key = `${year}-${pad(monthIndex + 1)}-${pad(day)}`
    cells.push({ day, key, booked: booked.has(key) })
  }

  const label = view.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg">{label}</h3>
        <div className="flex gap-3 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-success" /> Open
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-danger" /> Booked
          </span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-500">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="py-1 font-medium">
            {d}
          </div>
        ))}
        {cells.map((cell) =>
          cell.day == null ? (
            <div key={cell.key} className="h-9" />
          ) : (
            <div
              key={cell.key}
              className={`flex h-9 items-center justify-center rounded-md text-sm ${
                cell.booked
                  ? 'bg-danger/10 text-danger line-through'
                  : 'bg-surface-tint text-primary'
              }`}
              title={cell.booked ? 'Booked' : 'Open'}
            >
              {cell.day}
            </div>
          ),
        )}
      </div>
    </div>
  )
}
