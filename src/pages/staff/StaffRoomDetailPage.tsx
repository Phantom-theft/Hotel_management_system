import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getRoomTypeReviews, searchRooms } from '../../api/hotel'
import { StaffAvailabilityCalendar } from '../../components/staff/StaffAvailabilityCalendar'
import { RatingBadge, StarRating } from '../../components/ui/StarRating'
import { useStaffRoomAvailability } from '../../hooks/staff/useStaffRoomAvailability'
import { useAuthStore } from '../../store/authStore'
import { useBookingFlowStore } from '../../store/bookingFlowStore'
import { STAFF_ROOMS_LIST_PATH } from '../../utils/staff/staffRoomsPaths'

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

const statusStyles: Record<string, string> = {
  available: 'bg-success/15 text-success ring-1 ring-success/30',
  occupied: 'bg-warning/15 text-warning ring-1 ring-warning/30',
  maintenance: 'bg-neutral-200 text-neutral-700 ring-1 ring-neutral-300',
}

export function StaffRoomDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const checkIn = params.get('checkIn') ?? defaultCheckIn()
  const checkOut = params.get('checkOut') ?? defaultCheckOut()
  const guests = Number(params.get('guests') ?? 2)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setDraft = useBookingFlowStore((s) => s.setDraft)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const listPath = STAFF_ROOMS_LIST_PATH

  const [calendarMonth] = useState(() => new Date())

  const roomQuery = useQuery({
    queryKey: ['room-detail', id, checkIn, checkOut, guests],
    enabled: !!id,
    queryFn: async () => {
      const { rooms } = await searchRooms({ checkIn, checkOut, guests })
      const found = rooms.find((r) => r.id === id)
      if (!found) {
        const wideIn = defaultCheckIn()
        const wideOut = (() => {
          const d = new Date()
          d.setDate(d.getDate() + 60)
          return d.toISOString().slice(0, 10)
        })()
        const wider = await searchRooms({ checkIn: wideIn, checkOut: wideOut, guests: 1 })
        return wider.rooms.find((r) => r.id === id) ?? null
      }
      return found
    },
  })

  const room = roomQuery.data
  const roomType = room?.roomType
  const availability = useStaffRoomAvailability(id, calendarMonth)

  const reviewsQuery = useQuery({
    queryKey: ['reviews', roomType?.id],
    enabled: !!roomType?.id,
    queryFn: () => getRoomTypeReviews(roomType!.id, 1, 5),
  })

  const hero = useMemo(() => {
    if (roomType?.images?.[0]) return roomType.images[0]
    return 'linear-gradient(145deg, #1e3a6e 0%, #0f1e3c 55%, #2563eb 100%)'
  }, [roomType?.images])

  const heroIsGradient = hero.startsWith('linear-gradient')

  if (roomQuery.isLoading) {
    return <p className="text-neutral-500">Loading room…</p>
  }

  if (!room || !roomType) {
    return (
      <div className="space-y-3">
        <p className="text-neutral-700">Room not found or not available for the selected dates.</p>
        <Link to={listPath} className="font-semibold text-accent hover:underline">
          ← Back to rooms
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Link to={listPath} className="text-sm font-semibold text-accent hover:underline">
        ← Back to rooms
      </Link>

      <section
        className="relative h-64 overflow-hidden rounded-xl sm:h-80"
        style={
          heroIsGradient
            ? { backgroundImage: hero }
            : { backgroundImage: `url(${hero})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        }
      >
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-primary/20" />
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            statusStyles[room.status] ?? statusStyles.available
          }`}
        >
          {room.status}
        </span>
        <div className="absolute bottom-0 p-6 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Harborlight</p>
          <h1 className="font-display text-4xl font-extrabold">{roomType.name}</h1>
          <p className="mt-1 text-neutral-200">
            Room {room.roomNumber} · Floor {room.floor}
          </p>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-neutral-100 bg-white p-5 shadow-card">
            <h2 className="font-display text-2xl font-bold text-primary">About this room</h2>
            <p className="mt-2 leading-relaxed text-neutral-600">
              {roomType.description ?? 'A thoughtfully appointed room for a restful stay.'}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-100 bg-white p-5 shadow-card">
            <h3 className="font-display font-bold text-primary">Amenities</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {(roomType.amenities.length ? roomType.amenities : ['WiFi', 'Climate control']).map(
                (a) => (
                  <li
                    key={a}
                    className="rounded-full bg-surface-tint px-3 py-1.5 text-sm font-medium text-primary ring-1 ring-accent/10"
                  >
                    {a}
                  </li>
                ),
              )}
            </ul>
          </div>

          {roomType.images.length > 1 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {roomType.images.slice(0, 6).map((src) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="h-28 w-full rounded-xl object-cover ring-1 ring-neutral-100"
                />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-neutral-100 bg-white p-5 shadow-card">
            <p className="text-3xl font-bold text-accent">
              ${roomType.basePrice.toFixed(0)}
              <span className="text-base font-normal text-neutral-500"> / night</span>
            </p>
            <p className="mt-1 text-sm text-neutral-500">Up to {roomType.capacity} guests</p>
            <p className="mt-3 text-sm text-neutral-600">
              Stay window: {checkIn} → {checkOut}
            </p>
            {isAuthenticated ? (
              <button
                type="button"
                className="mt-4 inline-flex w-full justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light sm:w-auto"
                onClick={() => {
                  if (!room) return
                  setDraft({
                    roomId: room.id,
                    checkIn,
                    checkOut,
                    guestsCount: guests,
                    guestName: user?.name ?? '',
                    guestEmail: user?.email ?? '',
                    guestPhone: user?.phone ?? '',
                    roomSnapshot: room,
                  })
                  navigate(
                    `/book?roomId=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`,
                  )
                }}
              >
                Book this room
              </button>
            ) : (
              <Link
                to="/login"
                className="mt-4 inline-flex w-full justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light sm:w-auto"
              >
                Sign in to book
              </Link>
            )}
          </div>

          {availability.isLoading ? (
            <p className="text-sm text-neutral-500">Loading availability calendar…</p>
          ) : (
            <StaffAvailabilityCalendar bookedDates={availability.data ?? []} month={calendarMonth} />
          )}
        </aside>
      </div>

      {/* Reviews — testimonial-style on tinted background */}
      <section className="-mx-4 rounded-none bg-surface-tint px-4 py-12 sm:mx-0 sm:rounded-xl sm:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Guest reviews
          </p>
          <h2 className="mt-2 text-center font-display text-2xl font-extrabold text-primary sm:text-3xl">
            What guests are saying
          </h2>

          {reviewsQuery.isLoading && (
            <p className="mt-6 text-center text-sm text-neutral-500">Loading reviews…</p>
          )}

          {reviewsQuery.data && (
            <>
              <div className="mt-6 flex justify-center">
                {reviewsQuery.data.total > 0 ? (
                  <RatingBadge
                    rating={reviewsQuery.data.averageRating}
                    total={reviewsQuery.data.total}
                  />
                ) : (
                  <p className="text-sm text-neutral-600">
                    No reviews yet — be the first to stay and share feedback.
                  </p>
                )}
              </div>

              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {reviewsQuery.data.reviews.map((r) => (
                  <li
                    key={r.id}
                    className="relative rounded-xl border border-neutral-100 bg-white p-5 shadow-card"
                  >
                    <span
                      className="absolute right-4 top-4 text-3xl text-accent/20"
                      aria-hidden
                    >
                      "
                    </span>
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
                        aria-hidden
                      >
                        {r.user.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-primary">{r.user.name}</p>
                        <StarRating value={r.rating} size="sm" label={`${r.rating} stars`} />
                      </div>
                    </div>
                    {r.comment && (
                      <p className="mt-3 text-sm leading-relaxed text-neutral-600">{r.comment}</p>
                    )}
                    <time className="mt-2 block text-xs text-neutral-400" dateTime={r.createdAt}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </time>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
