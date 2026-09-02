import { ArrowRight, CalendarRange } from 'lucide-react'
import { useAdminDashboardShell } from '../../contexts/admin/AdminDashboardShellContext'

interface AdminDateRangePickerProps {
  className?: string
}

export function AdminDateRangePicker({ className = '' }: AdminDateRangePickerProps) {
  const { dateRange, setDateRange } = useAdminDashboardShell()

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm ${className}`}
    >
      <CalendarRange className="h-4 w-4 shrink-0 text-primary/70" aria-hidden />
      <label className="sr-only" htmlFor="admin-date-from">
        From date
      </label>
      <input
        id="admin-date-from"
        type="date"
        value={dateRange.from}
        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
        className="w-[6.75rem] cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-neutral-700 outline-none [color-scheme:light] focus:ring-0 sm:w-[7.25rem]"
      />
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" aria-hidden />
      <label className="sr-only" htmlFor="admin-date-to">
        To date
      </label>
      <input
        id="admin-date-to"
        type="date"
        value={dateRange.to}
        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
        className="w-[6.75rem] cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-neutral-700 outline-none [color-scheme:light] focus:ring-0 sm:w-[7.25rem]"
      />
    </div>
  )
}
