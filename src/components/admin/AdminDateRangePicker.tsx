import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ArrowRight, CalendarRange, X } from 'lucide-react'
import { FullScreenCalendar } from '@/components/ui/fullscreen-calendar'
import { Button } from '@/components/ui/button'
import { useAdminDashboardShell } from '../../contexts/admin/AdminDashboardShellContext'

interface AdminDateRangePickerProps {
  className?: string
}

function toDate(value: string) {
  return parseISO(value)
}

function toIsoDate(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

export function AdminDateRangePicker({ className = '' }: AdminDateRangePickerProps) {
  const { dateRange, setDateRange } = useAdminDashboardShell()
  const [open, setOpen] = useState(false)
  const [draftFrom, setDraftFrom] = useState<Date | undefined>()
  const [draftTo, setDraftTo] = useState<Date | undefined>()

  useEffect(() => {
    if (!open) return

    setDraftFrom(toDate(dateRange.from))
    setDraftTo(toDate(dateRange.to))

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, dateRange.from, dateRange.to])

  function handleDaySelect(day: Date) {
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(day)
      setDraftTo(undefined)
      return
    }

    if (day < draftFrom) {
      setDraftTo(draftFrom)
      setDraftFrom(day)
      return
    }

    setDraftTo(day)
  }

  function handleApply() {
    if (!draftFrom || !draftTo) return
    setDateRange({ from: toIsoDate(draftFrom), to: toIsoDate(draftTo) })
    setOpen(false)
  }

  const displayFrom = format(parseISO(dateRange.from), 'MMM d, yyyy')
  const displayTo = format(parseISO(dateRange.to), 'MMM d, yyyy')

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-full bg-neutral-100/80 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-200/70 ${className}`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalendarRange className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
        <span>{displayFrom}</span>
        <ArrowRight className="h-3 w-3 shrink-0 text-neutral-300" aria-hidden />
        <span>{displayTo}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-3 sm:p-6"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="date-range-title"
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
              <div>
                <h2 id="date-range-title" className="text-sm font-semibold text-foreground">
                  Select date range
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {draftFrom && draftTo
                    ? `${format(draftFrom, 'MMM d, yyyy')} – ${format(draftTo, 'MMM d, yyyy')}`
                    : draftFrom
                      ? `Start: ${format(draftFrom, 'MMM d, yyyy')} — pick an end date`
                      : 'Choose a start date, then an end date'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <FullScreenCalendar
                mode="range"
                rangeFrom={draftFrom}
                rangeTo={draftTo}
                onDaySelect={handleDaySelect}
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3 sm:px-6">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApply} disabled={!draftFrom || !draftTo}>
                Apply range
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
