import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  checkInBooking,
  checkOutBooking,
  createWalkIn,
  getTodaysBookings,
  listAllRooms,
} from '../api/hotel'
import { BookingListSkeleton } from '../components/Skeletons'
import { StatusBadge } from '../components/StatusBadge'
import { toast } from '../store/toastStore'
import { formatStay } from '../utils/bookingFormat'
import type { Booking, Room, RoomStatus } from '../types/api'

const statusColor: Record<RoomStatus, string> = {
  available: 'bg-surface-tint border-accent/30 text-primary',
  occupied: 'bg-amber-100 border-amber-300 text-amber-900',
  maintenance: 'bg-neutral-300 border-neutral-400 text-neutral-800',
}

export function StaffDashboardPage() {
  const queryClient = useQueryClient()
  const todayQuery = useQuery({ queryKey: ['bookings-today'], queryFn: getTodaysBookings })
  const roomsQuery = useQuery({ queryKey: ['rooms-admin-all'], queryFn: listAllRooms })

  const checkInMut = useMutation({
    mutationFn: checkInBooking,
    onSuccess: () => {
      toast('Guest checked in', 'success')
      void queryClient.invalidateQueries({ queryKey: ['bookings-today'] })
      void queryClient.invalidateQueries({ queryKey: ['rooms-admin-all'] })
    },
    onError: (err: unknown) => {
      toast(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Check-in failed',
        'error',
      )
    },
  })

  const checkOutMut = useMutation({
    mutationFn: checkOutBooking,
    onSuccess: () => {
      toast('Guest checked out', 'success')
      void queryClient.invalidateQueries({ queryKey: ['bookings-today'] })
      void queryClient.invalidateQueries({ queryKey: ['rooms-admin-all'] })
    },
    onError: (err: unknown) => {
      toast(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Check-out failed',
        'error',
      )
    },
  })

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-primary">Staff desk</h1>
        <p className="mt-1 text-neutral-600">
          Today&apos;s arrivals and departures, walk-ins, and live room status.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <TodayList
          title="Check-ins today"
          empty="No arrivals scheduled."
          loading={todayQuery.isLoading}
          bookings={todayQuery.data?.checkIns ?? []}
          actionLabel="Check in"
          onAction={(id) => checkInMut.mutate(id)}
          busy={checkInMut.isPending}
          showAction={(b) => b.status === 'confirmed'}
        />
        <TodayList
          title="Check-outs today"
          empty="No departures scheduled."
          loading={todayQuery.isLoading}
          bookings={todayQuery.data?.checkOuts ?? []}
          actionLabel="Check out"
          onAction={(id) => checkOutMut.mutate(id)}
          busy={checkOutMut.isPending}
          showAction={(b) => b.status === 'checked_in'}
        />
      </section>

      <WalkInForm rooms={roomsQuery.data?.rooms ?? []} onCreated={() => {
        void queryClient.invalidateQueries({ queryKey: ['bookings-today'] })
        void queryClient.invalidateQueries({ queryKey: ['rooms-admin-all'] })
      }} />

      <RoomStatusBoard rooms={roomsQuery.data?.rooms ?? []} loading={roomsQuery.isLoading} />
    </div>
  )
}

function TodayList({
  title,
  empty,
  loading,
  bookings,
  actionLabel,
  onAction,
  busy,
  showAction,
}: {
  title: string
  empty: string
  loading: boolean
  bookings: Booking[]
  actionLabel: string
  onAction: (id: string) => void
  busy: boolean
  showAction: (b: Booking) => boolean
}) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-4 shadow-card">
      <h2 className="font-display text-xl">{title}</h2>
      {loading && <div className="mt-3"><BookingListSkeleton count={2} /></div>}
      {!loading && bookings.length === 0 && <p className="mt-3 text-sm text-neutral-500">{empty}</p>}
      <ul className="mt-3 space-y-2">
        {bookings.map((b) => (
          <li
            key={b.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-100 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-neutral-900">
                {b.room?.roomType?.name ?? 'Room'} · #{b.room?.roomNumber ?? '—'}
              </p>
              <p className="text-xs text-neutral-500">{formatStay(b.checkIn, b.checkOut)}</p>
              <div className="mt-1">
                <StatusBadge status={b.status} />
              </div>
            </div>
            {showAction(b) && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction(b.id)}
                className="rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-60"
              >
                {actionLabel}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function WalkInForm({ rooms, onCreated }: { rooms: Room[]; onCreated: () => void }) {
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
    onSuccess: () => {
      toast('Walk-in booking confirmed (no online payment)', 'success')
      setGuestName('')
      setGuestEmail('')
      setGuestPhone('')
      onCreated()
    },
    onError: (err: unknown) => {
      toast(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Walk-in failed',
        'error',
      )
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!roomId) {
      toast('Select a room', 'error')
      return
    }
    mut.mutate({
      roomId,
      checkIn,
      checkOut,
      guestsCount,
      guestName,
      guestEmail,
      guestPhone: guestPhone || undefined,
    })
  }

  return (
    <section className="rounded-xl border border-neutral-100 bg-white p-5 shadow-card">
      <h2 className="font-display text-xl">Walk-in booking</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Creates a <strong>confirmed</strong> booking immediately — payment is taken at the desk.
      </p>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
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
          <input type="date" required value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">Check-out</span>
          <input type="date" required value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">Guests</span>
          <input type="number" min={1} required value={guestsCount} onChange={(e) => setGuestsCount(Number(e.target.value))} className="w-full rounded-md border border-neutral-300 px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">Guest name</span>
          <input required value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">Guest email</span>
          <input type="email" required value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-neutral-600">Phone</span>
          <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2" />
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
    </section>
  )
}

function RoomStatusBoard({ rooms, loading }: { rooms: Room[]; loading: boolean }) {
  const byFloor = useMemo(() => {
    const map = new Map<number, Room[]>()
    for (const r of rooms) {
      const list = map.get(r.floor) ?? []
      list.push(r)
      map.set(r.floor, list)
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [rooms])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-xl">Room status board</h2>
        <div className="flex gap-3 text-xs text-neutral-600">
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-success" /> Available</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Occupied</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-neutral-400" /> Maintenance</span>
        </div>
      </div>
      {loading && <BookingListSkeleton count={3} />}
      {byFloor.map(([floor, floorRooms]) => (
        <div key={floor}>
          <p className="mb-2 text-sm font-medium text-neutral-500">Floor {floor}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {floorRooms
              .slice()
              .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
              .map((r) => (
                <div
                  key={r.id}
                  className={`rounded-lg border px-3 py-3 text-center ${statusColor[r.status]}`}
                >
                  <p className="text-lg font-semibold">#{r.roomNumber}</p>
                  <p className="text-xs opacity-80">{r.roomType?.name ?? 'Room'}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide">{r.status}</p>
                </div>
              ))}
          </div>
        </div>
      ))}
      {!loading && rooms.length === 0 && (
        <p className="text-sm text-neutral-500">No rooms found. Ask an admin to create inventory.</p>
      )}
    </section>
  )
}
