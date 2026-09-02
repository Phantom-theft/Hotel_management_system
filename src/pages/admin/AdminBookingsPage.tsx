import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  checkInBooking,
  checkOutBooking,
  getTodaysBookings,
  listAllBookings,
  listAllRooms,
} from '../../api/hotel'
import { AdminBookingTable } from '../../components/admin/AdminBookingTable'
import { AdminDashboardCard, AdminDashboardStatCard } from '../../components/admin/AdminDashboardCards'
import { AdminWalkInForm } from '../../components/admin/AdminWalkInForm'
import { BookingListSkeleton } from '../../components/ui/Skeletons'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../utils/apiError'
import type { Booking } from '../../types/api'

type BookingFilter = 'all' | 'check-ins' | 'check-outs'

const FILTER_TABS: { id: BookingFilter; label: string }[] = [
  { id: 'all', label: 'All bookings' },
  { id: 'check-ins', label: "Today's check-ins" },
  { id: 'check-outs', label: "Today's check-outs" },
]

export function AdminBookingsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<BookingFilter>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const allQuery = useQuery({ queryKey: ['admin-bookings-all'], queryFn: listAllBookings })
  const todayQuery = useQuery({ queryKey: ['bookings-today'], queryFn: getTodaysBookings })
  const roomsQuery = useQuery({ queryKey: ['rooms-admin-all'], queryFn: listAllRooms })

  const checkIns = todayQuery.data?.checkIns ?? []
  const checkOuts = todayQuery.data?.checkOuts ?? []

  const displayedBookings = useMemo((): Booking[] => {
    if (filter === 'check-ins') return checkIns
    if (filter === 'check-outs') return checkOuts
    return allQuery.data?.bookings ?? []
  }, [filter, allQuery.data?.bookings, checkIns, checkOuts])

  const loading =
    filter === 'all' ? allQuery.isLoading : todayQuery.isLoading

  function invalidateBookingQueries() {
    void queryClient.invalidateQueries({ queryKey: ['admin-bookings-all'] })
    void queryClient.invalidateQueries({ queryKey: ['bookings-today'] })
    void queryClient.invalidateQueries({ queryKey: ['rooms-admin-all'] })
  }

  const checkInMut = useMutation({
    mutationFn: checkInBooking,
    onMutate: (id) => setBusyId(id),
    onSuccess: () => {
      toast('Guest checked in', 'success')
      invalidateBookingQueries()
    },
    onError: (err: unknown) => {
      toast(getApiErrorMessage(err, { fallback: 'Check-in failed. Please try again.' }), 'error')
    },
    onSettled: () => setBusyId(null),
  })

  const checkOutMut = useMutation({
    mutationFn: checkOutBooking,
    onMutate: (id) => setBusyId(id),
    onSuccess: () => {
      toast('Guest checked out', 'success')
      invalidateBookingQueries()
    },
    onError: (err: unknown) => {
      toast(getApiErrorMessage(err, { fallback: 'Check-out failed. Please try again.' }), 'error')
    },
    onSettled: () => setBusyId(null),
  })

  const emptyMessages: Record<BookingFilter, string> = {
    all: 'No bookings yet.',
    'check-ins': 'No arrivals scheduled for today.',
    'check-outs': 'No departures scheduled for today.',
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminDashboardStatCard
          featured
          label="Today's check-ins"
          value={String(checkIns.length)}
          hint={todayQuery.data?.date}
        />
        <AdminDashboardStatCard
          label="Today's check-outs"
          value={String(checkOuts.length)}
          hint="Scheduled departures"
        />
      </div>

      <AdminWalkInForm rooms={roomsQuery.data?.rooms ?? []} onCreated={invalidateBookingQueries} />

      <AdminDashboardCard
        title="Bookings"
        description="Manage reservations, check guests in and out, and review today's activity."
      >
        <div className="mb-4 flex flex-wrap gap-2 border-b border-neutral-100 pb-4">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {tab.label}
              {tab.id === 'check-ins' && checkIns.length > 0 && (
                <span className="ml-1.5 opacity-80">({checkIns.length})</span>
              )}
              {tab.id === 'check-outs' && checkOuts.length > 0 && (
                <span className="ml-1.5 opacity-80">({checkOuts.length})</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <BookingListSkeleton count={4} />
        ) : (
          <AdminBookingTable
            bookings={displayedBookings}
            emptyMessage={emptyMessages[filter]}
            actions={{
              onCheckIn: (id) => checkInMut.mutate(id),
              onCheckOut: (id) => checkOutMut.mutate(id),
              busyId,
            }}
          />
        )}
      </AdminDashboardCard>
    </div>
  )
}
