import { useMemo, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ChevronDown, Plus } from 'lucide-react'
import { createWalkIn } from '../../api/hotel'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../utils/apiError'
import type { Room } from '../../types/api'
import { AdminDashboardCard } from './AdminDashboardCards'

export function AdminWalkInForm({
  rooms,
  onCreated,
  onCancel,
  inModal = false,
}: {
  rooms: Room[]
  onCreated: () => void
  onCancel?: () => void
  inModal?: boolean
}) {
  const available = useMemo(
    () => rooms.filter((r) => r.status === 'available'),
    [rooms],
  )
  const [roomId, setRoomId] = useState('')
  const [checkIn, setCheckIn] = useState(() => new Date().toISOString().slice(0, 10))
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  })
  const [guestsCount, setGuestsCount] = useState(1)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')

  const mut = useMutation({
    mutationFn: createWalkIn,
    onSuccess: (_data, variables) => {
      toast(`Walk-in booking created for ${variables.guestName}.`, 'success')
      setGuestName('')
      setGuestEmail('')
      setGuestPhone('')
      setRoomId('')
      onCreated()
    },
    onError: (err: unknown) => {
      toast(
        getApiErrorMessage(err, {
          conflict:
            "This room isn't available for the selected dates — please choose different dates or another room.",
          validation: 'Please complete all required fields with valid values.',
          fallback: 'Walk-in booking could not be created. Please try again.',
        }),
        'error',
      )
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()

    if (!roomId) {
      toast('Select a room before creating a walk-in booking.', 'error')
      return
    }
    if (!guestName.trim()) {
      toast('Guest name is required.', 'error')
      return
    }
    if (!guestEmail.trim()) {
      toast('Guest email is required.', 'error')
      return
    }
    if (checkOut <= checkIn) {
      toast('Check-out must be after check-in.', 'error')
      return
    }
    if (guestsCount < 1) {
      toast('At least one guest is required.', 'error')
      return
    }

    mut.mutate({
      roomId,
      checkIn,
      checkOut,
      guestsCount,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone.trim() || undefined,
    })
  }

  const formContent = (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      {/* Room Select */}
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-xs font-medium text-neutral-500">Available Room</label>
        <div className="relative">
          <select
            required
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full appearance-none rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 pr-8 text-sm text-neutral-800 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
          >
            <option value="">Select available room</option>
            {available.map((r) => (
              <option key={r.id} value={r.id}>
                Room #{r.roomNumber} · {r.roomType?.name ?? 'Room'} · Floor {r.floor} · ${r.roomType?.basePrice ?? 0}/night
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        </div>
      </div>

      {/* Dates */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-neutral-500">Check-in Date</label>
        <input
          type="date"
          required
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-800 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-neutral-500">Check-out Date</label>
        <input
          type="date"
          required
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-800 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
        />
      </div>

      {/* Guests & Phone */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-neutral-500">Number of Guests</label>
        <input
          type="number"
          min={1}
          required
          value={guestsCount}
          onChange={(e) => setGuestsCount(Number(e.target.value))}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-800 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-neutral-500">Phone (optional)</label>
        <input
          type="tel"
          placeholder="e.g. +1 555-0199"
          value={guestPhone}
          onChange={(e) => setGuestPhone(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
        />
      </div>

      {/* Guest Name & Email */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-neutral-500">Guest Full Name</label>
        <input
          required
          placeholder="e.g. John Doe"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-neutral-500">Guest Email Address</label>
        <input
          type="email"
          required
          placeholder="e.g. john.doe@example.com"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4 sm:col-span-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={mut.isPending}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          <span>{mut.isPending ? 'Creating…' : 'Create Walk-in Booking'}</span>
        </button>
      </div>
    </form>
  )

  if (inModal) {
    return formContent
  }

  return (
    <AdminDashboardCard
      title="Walk-in booking"
      description="Creates a confirmed booking immediately — payment is taken at the desk."
    >
      {formContent}
    </AdminDashboardCard>
  )
}
