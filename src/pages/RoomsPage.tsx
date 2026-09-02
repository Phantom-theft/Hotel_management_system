import { useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RoomCard } from '../components/RoomCard'
import { EmptyState } from '../components/EmptyState'
import { RoomGridSkeleton } from '../components/Skeletons'
import { useRoomsPaths } from '../hooks/useRoomsPaths'
import { useRoomSearch } from '../hooks/useRoomSearch'

function defaultCheckIn() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function defaultCheckOut() {
  const d = new Date()
  d.setDate(d.getDate() + 3)
  return d.toISOString().slice(0, 10)
}

export function RoomsPage() {
  const [params, setParams] = useSearchParams()
  const { isDashboardRooms, detailPath } = useRoomsPaths()
  const [checkIn, setCheckIn] = useState(params.get('checkIn') ?? defaultCheckIn())
  const [checkOut, setCheckOut] = useState(params.get('checkOut') ?? defaultCheckOut())
  const [guests, setGuests] = useState(Number(params.get('guests') ?? 2))
  const [type, setType] = useState(params.get('type') ?? '')
  const [submitted, setSubmitted] = useState(() => !!params.get('checkIn'))

  const filters = useMemo(
    () => ({
      checkIn,
      checkOut,
      guests,
      type: type || undefined,
      enabled: submitted,
    }),
    [checkIn, checkOut, guests, type, submitted],
  )

  const { data, isLoading, isError, error, roomTypes, refetch, isFetching } = useRoomSearch(filters)

  function onSearch(e: FormEvent) {
    e.preventDefault()
    const next = new URLSearchParams()
    next.set('checkIn', checkIn)
    next.set('checkOut', checkOut)
    next.set('guests', String(guests))
    if (type) next.set('type', type)
    setParams(next)
    setSubmitted(true)
    void refetch()
  }

  return (
    <div className={isDashboardRooms ? 'space-y-6' : 'space-y-10'}>
      {!isDashboardRooms && (
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Availability</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
            Find a room
          </h1>
          <p className="mt-2 text-neutral-600">
            Search by dates, guests, and room type. Results exclude overlapping reservations and
            maintenance rooms.
          </p>
        </div>
      )}

      {isDashboardRooms && (
        <p className="text-sm text-neutral-600">
          Search by dates, guests, and room type. Results exclude overlapping reservations and
          maintenance rooms.
        </p>
      )}

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

      {!submitted && (
        <EmptyState
          title="Start your search"
          description="Pick check-in and check-out dates, then search to see rooms available for your stay."
          icon={
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-tint text-2xl text-accent"
              aria-hidden
            >
              ⌕
            </span>
          }
        />
      )}

      {submitted && isLoading && <RoomGridSkeleton />}

      {submitted && isError && (
        <p
          className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {(error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            'Failed to load rooms'}
        </p>
      )}

      {submitted && !isLoading && data && (
        <>
          <p className="text-sm font-medium text-neutral-500">
            {data.rooms.length} room{data.rooms.length === 1 ? '' : 's'} available
          </p>
          {data.rooms.length === 0 ? (
            <EmptyState
              title="No rooms match your search"
              description="Try different dates, fewer guests, or another room type. Maintenance and booked rooms are excluded."
              actionLabel="Adjust search"
              onAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  guests={guests}
                  detailPath={detailPath(room.id, new URLSearchParams({
                    checkIn,
                    checkOut,
                    guests: String(guests),
                  }).toString())}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
