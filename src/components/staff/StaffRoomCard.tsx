import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Room } from '../../types/api'
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
  const primaryImage = type?.images?.[0]
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(primaryImage) && !imageFailed
  const placeholder = placeholders[room.roomNumber.charCodeAt(0) % placeholders.length]

  const params = new URLSearchParams()
  if (checkIn) params.set('checkIn', checkIn)
  if (checkOut) params.set('checkOut', checkOut)
  if (guests) params.set('guests', String(guests))
  const qs = params.toString()

  const amenities = (type?.amenities ?? []).slice(0, 2)

  return (
    <article className="group overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="relative h-40 overflow-hidden bg-neutral-100 sm:h-44">
        {showImage ? (
          <img
            src={primaryImage}
            alt={type?.name ?? `Room ${room.roomNumber}`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            className="h-full w-full transition duration-300 group-hover:scale-[1.03]"
            style={{ backgroundImage: placeholder }}
            role="img"
            aria-label={type?.name ?? `Room ${room.roomNumber}`}
          />
        )}
        <span
          className={`absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
            statusStyles[room.status] ?? statusStyles.available
          }`}
        >
          {room.status}
        </span>
        <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
          #{room.roomNumber}
        </span>
      </div>

      <div className="space-y-2.5 p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-bold text-primary sm:text-lg">
              {type?.name ?? 'Room'}
            </h3>
            <p className="text-xs text-neutral-500">Floor {room.floor}</p>
          </div>
          <p className="shrink-0 text-right">
            <span className="text-base font-bold text-accent sm:text-lg">
              ${type?.basePrice?.toFixed(0) ?? '—'}
            </span>
            <span className="block text-[10px] text-neutral-500">/ night</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[11px] text-neutral-600">
          <span className="inline-flex items-center rounded-full bg-neutral-50 px-2 py-0.5 ring-1 ring-neutral-100">
            Up to {type?.capacity ?? '—'}
          </span>
          {amenities.map((a) => (
            <span
              key={a}
              className="inline-flex items-center rounded-full bg-neutral-50 px-2 py-0.5 ring-1 ring-neutral-100"
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
