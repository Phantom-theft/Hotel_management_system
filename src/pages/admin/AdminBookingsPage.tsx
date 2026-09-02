import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, UserPlus, X } from 'lucide-react'
import {
  cancelBooking,
  checkInBooking,
  checkOutBooking,
  getTodaysBookings,
  listAllBookings,
  listAllRooms,
} from '../../api/hotel'
import { AdminBookingDetailModal } from '../../components/admin/AdminBookingDetailModal'
import { AdminBookingTable } from '../../components/admin/AdminBookingTable'
import { AdminDashboardCard, AdminDashboardStatCard } from '../../components/admin/AdminDashboardCards'
import { AdminWalkInForm } from '../../components/admin/AdminWalkInForm'
import { Modal } from '../../components/ui/Modal'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showWalkIn, setShowWalkIn] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const allQuery = useQuery({ queryKey: ['admin-bookings-all'], queryFn: listAllBookings })
  const todayQuery = useQuery({ queryKey: ['bookings-today'], queryFn: getTodaysBookings })
  const roomsQuery = useQuery({ queryKey: ['rooms-admin-all'], queryFn: listAllRooms })

  const checkIns = todayQuery.data?.checkIns ?? []
  const checkOuts = todayQuery.data?.checkOuts ?? []

  function invalidateBookingQueries() {
    void queryClient.invalidateQueries({ queryKey: ['admin-bookings-all'] })
    void queryClient.invalidateQueries({ queryKey: ['bookings-today'] })
    void queryClient.invalidateQueries({ queryKey: ['rooms-admin-all'] })
  }

  const checkInMut = useMutation({
    mutationFn: checkInBooking,
    onMutate: (id) => setBusyId(id),
    onSuccess: (data) => {
      toast('Guest checked in', 'success')
      if (selectedBooking && selectedBooking.id === data.booking.id) {
        setSelectedBooking(data.booking)
      }
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
    onSuccess: (data) => {
      toast('Guest checked out', 'success')
      if (selectedBooking && selectedBooking.id === data.booking.id) {
        setSelectedBooking(data.booking)
      }
      invalidateBookingQueries()
    },
    onError: (err: unknown) => {
      toast(getApiErrorMessage(err, { fallback: 'Check-out failed. Please try again.' }), 'error')
    },
    onSettled: () => setBusyId(null),
  })

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelBooking(id),
    onSuccess: () => {
      toast('Booking cancelled successfully', 'success')
      setCancellingBookingId(null)
      setSelectedBooking(null)
      invalidateBookingQueries()
    },
    onError: (err: unknown) => {
      toast(getApiErrorMessage(err, { fallback: 'Cancel failed' }), 'error')
    },
  })

  const rawBookings = useMemo((): Booking[] => {
    if (filter === 'check-ins') return checkIns
    if (filter === 'check-outs') return checkOuts
    return allQuery.data?.bookings ?? []
  }, [filter, allQuery.data?.bookings, checkIns, checkOuts])

  const displayedBookings = useMemo(() => {
    let list = rawBookings

    if (statusFilter !== 'all') {
      list = list.filter((b) => b.status === statusFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((b) => {
        const guestName = b.guest?.name?.toLowerCase() ?? ''
        const guestEmail = b.guest?.email?.toLowerCase() ?? ''
        const roomNum = b.room?.roomNumber?.toLowerCase() ?? ''
        const bookingId = b.id.toLowerCase()
        return (
          guestName.includes(q) ||
          guestEmail.includes(q) ||
          roomNum.includes(q) ||
          bookingId.includes(q)
        )
      })
    }

    return list
  }, [rawBookings, statusFilter, searchQuery])

  const loading = filter === 'all' ? allQuery.isLoading : todayQuery.isLoading

  const emptyMessages: Record<BookingFilter, string> = {
    all: searchQuery || statusFilter !== 'all' ? 'No matching bookings found.' : 'No bookings yet.',
    'check-ins': 'No arrivals scheduled for today.',
    'check-outs': 'No departures scheduled for today.',
  }

  return (
    <div className="space-y-6">
      {/* Top Stat Cards & Quick Action */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminDashboardStatCard
          featured
          label="Today's check-ins"
          value={String(checkIns.length)}
          hint={todayQuery.data?.date ?? 'Arrivals today'}
        />
        <AdminDashboardStatCard
          label="Today's check-outs"
          value={String(checkOuts.length)}
          hint="Scheduled departures"
        />
        <div className="flex flex-col justify-between rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Walk-in Desk</p>
            <p className="mt-1 text-sm text-neutral-600">Register direct arrivals without online pre-booking.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowWalkIn((prev) => !prev)}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-light"
          >
            {showWalkIn ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {showWalkIn ? 'Hide Walk-in Form' : 'New Walk-in Reservation'}
          </button>
        </div>
      </div>

      {/* Collapsible Walk-in Form */}
      {showWalkIn && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 transition-all shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-primary">Create Walk-in Reservation</h3>
            <button
              type="button"
              onClick={() => setShowWalkIn(false)}
              className="text-xs text-neutral-500 hover:text-neutral-800"
            >
              Cancel
            </button>
          </div>
          <AdminWalkInForm
            rooms={roomsQuery.data?.rooms ?? []}
            onCreated={() => {
              setShowWalkIn(false)
              invalidateBookingQueries()
            }}
          />
        </div>
      )}

      {/* Main Reservations Card */}
      <AdminDashboardCard
        title="Reservations & Front Desk"
        description="Search, inspect folios, manage guest check-ins, check-outs, and cancellations."
      >
        {/* Navigation Tabs */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilter(tab.id)
                  setSearchQuery('')
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === tab.id
                    ? 'bg-primary text-white shadow-sm'
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

          <div className="text-xs text-neutral-500 font-medium">
            Showing <strong className="text-primary">{displayedBookings.length}</strong> bookings
          </div>
        </div>

        {/* Search & Filter Controls Bar */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by guest name, email, room #, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 py-2 pl-9 pr-3 text-sm placeholder:text-neutral-400 focus:border-primary focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-neutral-500">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {(searchQuery || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
            >
              Reset Filters
            </button>
          )}
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
              onSelectBooking: (b) => setSelectedBooking(b),
              busyId,
            }}
          />
        )}
      </AdminDashboardCard>

      {/* Booking Detail Modal / Folio */}
      <AdminBookingDetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onCheckIn={(id) => checkInMut.mutate(id)}
        onCheckOut={(id) => checkOutMut.mutate(id)}
        onCancel={(id) => setCancellingBookingId(id)}
        busyId={busyId}
      />

      {/* Cancel Confirmation Modal */}
      <Modal
        open={!!cancellingBookingId}
        title="Cancel Reservation?"
        danger
        confirmLabel="Yes, Cancel Booking"
        confirming={cancelMut.isPending}
        onClose={() => setCancellingBookingId(null)}
        onConfirm={() => cancellingBookingId && cancelMut.mutate(cancellingBookingId)}
      >
        <p>
          Are you sure you want to cancel this booking? This will release the room back into inventory.
        </p>
      </Modal>
    </div>
  )
}

