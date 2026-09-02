import { BedDouble } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  checkInBooking,
  checkOutBooking,
  createWalkIn,
  getTodaysBookings,
  listAllRooms,
} from '../api/hotel'
import { DashboardCard, DashboardStatCard } from '../components/dashboard/DashboardCards'
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

  const rooms = roomsQuery.data?.rooms ?? []
  const checkIns = todayQuery.data?.checkIns ?? []
  const checkOuts = todayQuery.data?.checkOuts ?? []

  const roomStats = useMemo(() => {
    const occupied = rooms.filter((r) => r.status === 'occupied').length
    const available = rooms.filter((r) => r.status === 'available').length
    return { occupied, available }
  }, [rooms])

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
    <div className="space-y-6">
      {todayQuery.isLoading || roomsQuery.isLoading ? (
        <BookingListSkeleton count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            featured
            label="Today's check-ins"
            value={String(checkIns.length)}
            hint={todayQuery.data?.date}
          />
          <DashboardStatCard
            label="Today's check-outs"
            value={String(checkOuts.length)}
            hint="Scheduled departures"
          />
          <DashboardStatCard
            label="Occupied rooms"
            value={String(roomStats.occupied)}
            hint="Currently in-house"
          />
          <DashboardStatCard
            label="Available rooms"
            value={String(roomStats.available)}
            hint="Ready to assign"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <StaffTodayCard
          title="Check-ins today"
          empty="No arrivals scheduled."
          loading={todayQuery.isLoading}
          bookings={checkIns}
          actionLabel="Check in"
          onAction={(id) => checkInMut.mutate(id)}
          busy={checkInMut.isPending}
          showAction={(b) => b.status === 'confirmed'}
        />
        <StaffTodayCard
          title="Check-outs today"
          empty="No departures scheduled."
          loading={todayQuery.isLoading}
          bookings={checkOuts}
          actionLabel="Check out"
          onAction={(id) => checkOutMut.mutate(id)}
          busy={checkOutMut.isPending}
          showAction={(b) => b.status === 'checked_in'}
        />
      </div>

      <WalkInForm
        rooms={rooms}
        onCreated={() => {
          void queryClient.invalidateQueries({ queryKey: ['bookings-today'] })
          void queryClient.invalidateQueries({ queryKey: ['rooms-admin-all'] })
        }}
      />

      <DashboardCard title="Room status board" description="Live floor-by-floor availability">
        <RoomStatusBoard rooms={rooms} loading={roomsQuery.isLoading} />
      </DashboardCard>
    </div>
  )
}

function StaffTodayCard({
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
    <DashboardCard title={title}>
      {loading && <BookingListSkeleton count={2} />}
      {!loading && bookings.length === 0 && (
        <p className="py-6 text-center text-sm text-neutral-500">{empty}</p>
      )}
      {!loading && bookings.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-neutral-100 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <th className="px-3 py-2">Room</th>
                <th className="px-3 py-2">Stay</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const roomLabel = booking.room?.roomNumber ?? '—'
                const typeName = booking.room?.roomType?.name ?? 'Room'
                return (
                  <tr
                    key={booking.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
                          <BedDouble className="h-4 w-4" aria-hidden />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-primary">{typeName}</p>
                          <p className="text-xs text-neutral-500">#{roomLabel}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-neutral-600">
                      {formatStay(booking.checkIn, booking.checkOut)}
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold text-primary">
                      ${booking.totalPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      {showAction(booking) ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onAction(booking.id)}
                          className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-light disabled:opacity-60"
                        >
                          {actionLabel}
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
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
    <DashboardCard
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
    </DashboardCard>
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

  if (loading) {
    return <BookingListSkeleton count={3} />
  }

  if (rooms.length === 0) {
    return <p className="text-sm text-neutral-500">No rooms found. Ask an admin to create inventory.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-xs text-neutral-600">
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-success" /> Available</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Occupied</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-neutral-400" /> Maintenance</span>
      </div>
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
    </div>
  )
}
