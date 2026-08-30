import type { BookingStatus } from '../types/api'

const styles: Record<BookingStatus, string> = {
  pending: 'bg-warning/15 text-warning ring-1 ring-warning/30',
  confirmed: 'bg-success/15 text-success ring-1 ring-success/30',
  checked_in: 'bg-accent/15 text-accent ring-1 ring-accent/30',
  checked_out: 'bg-neutral-200 text-neutral-800 ring-1 ring-neutral-300',
  cancelled: 'bg-danger/15 text-danger ring-1 ring-danger/30',
}

const labels: Record<BookingStatus, string> = {
  pending: 'Pending payment',
  confirmed: 'Confirmed',
  checked_in: 'Checked in',
  checked_out: 'Checked out',
  cancelled: 'Cancelled',
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}
