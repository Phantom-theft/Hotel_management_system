import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { listAllBookings, listAllRooms } from '../../api/hotel'
import { searchAdminEntities } from '../../utils/adminGlobalSearch'
import { cn } from '../../lib/utils'

/**
 * Notification bell is a UI placeholder until an AuditLog/Notifications list
 * endpoint exists. Badge stays hidden (count = 0) so we never show a fake unread total.
 */
export function AdminNotificationBell({ className }: { className?: string }) {
  const unreadCount = 0

  return (
    <button
      type="button"
      className={cn(
        'relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm transition hover:bg-neutral-50 hover:text-[#0F1B3D]',
        className,
      )}
      aria-label="Notifications (coming soon)"
      title="Notifications coming soon — AuditLog feed not wired yet"
      disabled
    >
      <Bell className="h-4 w-4" aria-hidden />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}

export function AdminTopBarSearch({ className }: { className?: string }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const bookingsQuery = useQuery({
    queryKey: ['admin-bookings-all'],
    queryFn: listAllBookings,
    staleTime: 30_000,
  })
  const roomsQuery = useQuery({
    queryKey: ['rooms-admin-all'],
    queryFn: listAllRooms,
    staleTime: 30_000,
  })

  const hits = useMemo(
    () =>
      searchAdminEntities(
        query,
        bookingsQuery.data?.bookings ?? [],
        roomsQuery.data?.rooms ?? [],
      ),
    [query, bookingsQuery.data?.bookings, roomsQuery.data?.rooms],
  )

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const showPanel = open && query.trim().length > 0

  return (
    <div ref={rootRef} className={cn('relative w-full max-w-xs', className)}>
      <label className="relative block">
        <span className="sr-only">Search bookings, rooms, and guests</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search bookings, rooms, guests…"
          className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-800 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-[#0F1B3D]/30 focus:ring-2 focus:ring-[#0F1B3D]/10"
          autoComplete="off"
        />
      </label>

      {showPanel && (
        <div
          role="listbox"
          aria-label="Search results"
          className="absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-neutral-200 bg-white py-2 shadow-[0_12px_32px_rgba(15,27,61,0.12)]"
        >
          {hits.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-neutral-400">No matches</p>
          ) : (
            hits.map((hit) => (
              <Link
                key={hit.id}
                to={hit.to}
                role="option"
                onClick={() => {
                  setOpen(false)
                  setQuery('')
                }}
                className="flex flex-col gap-0.5 px-3 py-2.5 transition hover:bg-[#F5F6FA]"
              >
                <span className="flex items-center gap-2">
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    {hit.kind}
                  </span>
                  <span className="truncate text-sm font-semibold text-neutral-900">{hit.label}</span>
                </span>
                <span className="truncate pl-[3.25rem] text-xs text-neutral-400">{hit.sublabel}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
