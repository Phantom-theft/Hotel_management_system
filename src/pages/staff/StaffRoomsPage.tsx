import { useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Room } from '../../types/api'
import { StaffRoomCard } from '../../components/staff/StaffRoomCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { RoomGridSkeleton } from '../../components/ui/Skeletons'
import { useStaffRoomSearch } from '../../hooks/staff/useStaffRoomSearch'

/** Local calendar date as YYYY-MM-DD (avoids UTC day-shift issues). */
function toLocalDateISO(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function defaultCheckIn() {
  return toLocalDateISO(new Date())
}

function defaultCheckOut() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return toLocalDateISO(d)
}

export function StaffRoomsPage() {
  const [params, setParams] = useSearchParams()

  const initialCheckIn = params.get('checkIn') ?? defaultCheckIn()
  const initialCheckOut = params.get('checkOut') ?? defaultCheckOut()
  const initialGuests = Number(params.get('guests') ?? 1)
  const initialType = params.get('type') ?? ''

  // Form draft (editable before Search)
  const [checkIn, setCheckIn] = useState(initialCheckIn)
  const [checkOut, setCheckOut] = useState(initialCheckOut)
  const [guests, setGuests] = useState(initialGuests)
  const [type, setType] = useState(initialType)

  // Applied query — starts with today's stay so results load immediately
  const [applied, setApplied] = useState({
    checkIn: initialCheckIn,
    checkOut: initialCheckOut,
    guests: initialGuests,
    type: initialType,
  })

  const filters = useMemo(
    () => ({
      checkIn: applied.checkIn,
      checkOut: applied.checkOut,
      guests: applied.guests,
      type: applied.type || undefined,
      enabled: true,
    }),
    [applied],
  )

  const { data, isLoading, isError, error, roomTypes, isFetching } = useStaffRoomSearch(filters)

  function onSearch(e: FormEvent) {
    e.preventDefault()
    const next = new URLSearchParams()
    next.set('checkIn', checkIn)
    next.set('checkOut', checkOut)
    next.set('guests', String(guests))
    if (type) next.set('type', type)
    setParams(next)
    setApplied({ checkIn, checkOut, guests, type })
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-600">
        Showing rooms available for today by default. Adjust dates, guests, or room type and search
        again to refine. Results exclude overlapping reservations and maintenance rooms.
      </p>

      <form
        onSubmit={onSearch}
        className="rounded-xl border border-neutral-100 bg-white p-4 shadow-card sm:p-5"
        aria-label="Search rooms"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-neutral-600">Check-in</span>
            <input
              type="date"
              required
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-accent"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-neutral-600">Check-out</span>
            <input
              type="date"
              required
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-accent"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-neutral-600">Guests</span>
            <input
              type="number"
              min={1}
              required
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-accent"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-neutral-600">Room type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-accent"
            >
              <option value="">All types</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light"
            >
              {isFetching ? 'Searching…' : 'Search'}
            </button>
          </div>
        </div>
      </form>

      {isLoading && <RoomGridSkeleton />}

      {isError && (
        <p
          className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {(error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            'Failed to load rooms'}
        </p>
      )}

      {!isLoading && data && (
        <>
          <p className="text-sm font-medium text-neutral-500">
            {data.rooms.length} room{data.rooms.length === 1 ? '' : 's'} available
            <span className="font-normal text-neutral-400">
              {' '}
              · {applied.checkIn} → {applied.checkOut}
            </span>
          </p>
          {data.rooms.length === 0 ? (
            <EmptyState
              title="No rooms match your search"
              description="Try different dates, fewer guests, or another room type. Maintenance and booked rooms are excluded."
              actionLabel="Adjust search"
              onAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.rooms.map((room: Room) => (
                <StaffRoomCard
                  key={room.id}
                  room={room}
                  checkIn={applied.checkIn}
                  checkOut={applied.checkOut}
                  guests={applied.guests}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
