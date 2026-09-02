import type { Room } from '../../types/api'
import { Link } from 'react-router-dom'
import { staffRoomDetailPath } from '../../utils/staff/staffRoomsPaths'

interface StaffRoomCardProps {
  room: Room
  checkIn?: string
  checkOut?: string
  guests?: number
}

const statusStyles: Record<string, string> = {
  available: 'bg-success/15 text-success ring-1 ring-success/30',
  occupied: 'bg-warning/15 text-warning ring-1 ring-warning/30',
  maintenance: 'bg-neutral-200 text-neutral-700 ring-1 ring-neutral-300',
}

const placeholders = [
  'linear-gradient(145deg, #1e3a6e 0%, #0f1e3c 45%, #2563eb 100%)',
  'linear-gradient(145deg, #0f1e3c 0%, #1e3a6e 50%, #64748b 100%)',
  'linear-gradient(160deg, #2563eb 0%, #0f1e3c 55%, #1e3a6e 100%)',
]

export function StaffRoomCard({ room, checkIn, checkOut, guests }: StaffRoomCardProps) {
  const type = room.roomType
  const image = type?.images?.[0]
  const placeholder = placeholders[room.roomNumber.charCodeAt(0) % placeholders.length]

  const params = new URLSearchParams()
  if (checkIn) params.set('checkIn', checkIn)
  if (checkOut) params.set('checkOut', checkOut)
  if (guests) params.set('guests', String(guests))
  const qs = params.toString()

  const amenities = (type?.amenities ?? []).slice(0, 3)

  return (
    <article className="group overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="relative h-48 overflow-hidden">
        <div
          className="h-full w-full bg-cover bg-center transition duration-300 group-hover:scale-[1.03]"
          style={
            image
              ? { backgroundImage: `url(${image})` }
              : { backgroundImage: placeholder }
          }
          role="img"
          aria-label={type?.name ?? `Room ${room.roomNumber}`}
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
            statusStyles[room.status] ?? statusStyles.available
          }`}
        >
          {room.status}
        </span>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold text-primary sm:text-xl">
              {type?.name ?? 'Room'}
            </h3>
            <p className="text-sm text-neutral-500">
              Room {room.roomNumber} · Floor {room.floor}
            </p>
          </div>
          <p className="text-right">
            <span className="text-lg font-bold text-accent">
              ${type?.basePrice?.toFixed(0) ?? '—'}
            </span>
            <span className="block text-xs text-neutral-500">/ night</span>
          </p>
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-neutral-600">
          {type?.description ?? 'Comfortable stay with thoughtful amenities.'}
        </p>

        <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-50 px-2.5 py-1 ring-1 ring-neutral-100">
            <span aria-hidden>👤</span> Up to {type?.capacity ?? '—'}
          </span>
          {amenities.map((a) => (
            <span
              key={a}
              className="inline-flex items-center rounded-full bg-neutral-50 px-2.5 py-1 ring-1 ring-neutral-100"
            >
              {a}
            </span>
          ))}
        </div>

        <Link
          to={staffRoomDetailPath(room.id, qs)}
          className="inline-flex text-sm font-semibold text-accent hover:underline"
        >
          View details →
        </Link>
      </div>
    </article>
  )
}
