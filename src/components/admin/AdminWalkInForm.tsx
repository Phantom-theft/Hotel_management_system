import { useMemo, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createWalkIn } from '../../api/hotel'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../utils/apiError'
import type { Room } from '../../types/api'
import { AdminDashboardCard } from './AdminDashboardCards'

export function AdminWalkInForm({
  rooms,
  onCreated,
}: {
  rooms: Room[]
  onCreated: () => void
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

  return (
    <AdminDashboardCard
      title="Walk-in booking"
      description="Creates a confirmed booking immediately — payment is taken at the desk."
    >
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-neutral-600">Room</span>
          <select
            required
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          >
            <option value="">Select available room</option>
            {available.map((r) => (
              <option key={r.id} value={r.id}>
                #{r.roomNumber} · {r.roomType?.name ?? 'Room'} · floor {r.floor}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">Check-in</span>
          <input
            type="date"
            required
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">Check-out</span>
          <input
            type="date"
            required
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">Guests</span>
          <input
            type="number"
            min={1}
            required
            value={guestsCount}
            onChange={(e) => setGuestsCount(Number(e.target.value))}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">Guest name</span>
          <input
            required
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">Guest email</span>
          <input
            type="email"
            required
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">Phone</span>
          <input
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>
        <div className="flex items-end sm:col-span-2">
          <button
            type="submit"
            disabled={mut.isPending}
            className="rounded-full bg-primary px-4 py-2.5 font-semibold text-white transition hover:bg-primary-light disabled:opacity-60"
          >
            {mut.isPending ? 'Creating…' : 'Create confirmed walk-in'}
          </button>
        </div>
      </form>
    </AdminDashboardCard>
  )
}
