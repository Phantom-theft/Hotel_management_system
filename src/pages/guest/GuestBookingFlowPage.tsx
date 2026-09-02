import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { createBooking, createPaymentIntent, getMyBookings, searchRooms } from '../../api/hotel'
import { GuestPaymentForm } from '../../components/guest/GuestPaymentForm'
import { GuestPromoCodeField } from '../../components/guest/GuestPromoCodeField'
import { PaymentSkeleton } from '../../components/ui/Skeletons'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useAuthStore } from '../../store/authStore'
import { useBookingFlowStore } from '../../store/bookingFlowStore'
import { toast } from '../../store/toastStore'
import {
  formatMoney,
  formatStay,
  isBookingExpired,
  msUntil,
  nightsBetween,
} from '../../utils/bookingFormat'
import type { Booking } from '../../types/api'

type Step = 'guests' | 'review' | 'pay' | 'done'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '')

export function GuestBookingFlowPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const { draft, setDraft, patchDraft, bookingId, setBookingId, clear } = useBookingFlowStore()

  const roomId = params.get('roomId') ?? draft?.roomId ?? ''
  const checkIn = params.get('checkIn') ?? draft?.checkIn ?? ''
  const checkOut = params.get('checkOut') ?? draft?.checkOut ?? ''
  const guestsCount = Number(params.get('guests') ?? draft?.guestsCount ?? 1)

  const [step, setStep] = useState<Step>('guests')
  const [promoCode, setPromoCode] = useState(draft?.promoCode ?? '')
  const [validPromo, setValidPromo] = useState<{ code: string; discountPercent: number } | null>(
    null,
  )
  const [creating, setCreating] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [expiryTick, setExpiryTick] = useState(0)

  useEffect(() => {
    if (!roomId || !checkIn || !checkOut) return
    if (!draft || draft.roomId !== roomId) {
      setDraft({
        roomId,
        checkIn,
        checkOut,
        guestsCount,
        guestName: user?.name ?? '',
        guestEmail: user?.email ?? '',
        guestPhone: user?.phone ?? '',
      })
    }
  }, [roomId, checkIn, checkOut, guestsCount, draft, setDraft, user])

  const roomQuery = useQuery({
    queryKey: ['booking-room', roomId, checkIn, checkOut, guestsCount],
    enabled: !!roomId && !!checkIn && !!checkOut,
    queryFn: async () => {
      const { rooms } = await searchRooms({ checkIn, checkOut, guests: guestsCount })
      return rooms.find((r) => r.id === roomId) ?? null
    },
  })

  useEffect(() => {
    if (roomQuery.data) {
      patchDraft({ roomSnapshot: roomQuery.data })
    }
  }, [roomQuery.data, patchDraft])

  useEffect(() => {
    const id = window.setInterval(() => setExpiryTick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const expiresAt = booking?.expiresAt
  const remainingMs = useMemo(() => msUntil(expiresAt), [expiresAt, expiryTick])

  useEffect(() => {
    if (!booking || booking.status !== 'pending') return
    if (isBookingExpired(booking.expiresAt)) {
      toast('Your booking hold expired. Please search again.', 'error')
      clear()
      navigate('/rooms')
    }
  }, [booking, remainingMs, clear, navigate])

  if (!roomId || !checkIn || !checkOut) {
    return <Navigate to="/rooms" replace />
  }

  const room = roomQuery.data ?? draft?.roomSnapshot
  const roomType = room?.roomType

  const pricing = useMemo(() => {
    if (!roomType) return null
    const nights = nightsBetween(checkIn, checkOut)
    const subtotal = roomType.basePrice * nights
    const discount = validPromo ? subtotal * (validPromo.discountPercent / 100) : 0
    return { nights, subtotal, discount, total: subtotal - discount }
  }, [roomType, checkIn, checkOut, validPromo])

  function onGuestsSubmit(e: FormEvent) {
    e.preventDefault()
    if (!draft?.guestName.trim() || !draft.guestEmail.trim()) {
      toast('Guest name and email are required', 'error')
      return
    }
    const code = validPromo?.code ?? promoCode.trim()
    patchDraft({ promoCode: code || undefined })
    setStep('review')
  }

  async function onConfirmHold() {
    if (!draft) return
    setCreating(true)
    try {
      const { booking: created } = await createBooking({
        roomId: draft.roomId,
        checkIn: draft.checkIn,
        checkOut: draft.checkOut,
        guestsCount: draft.guestsCount,
        promoCode: draft.promoCode,
      })
      setBooking(created)
      setBookingId(created.id)
      toast('Room hold created — complete payment to confirm', 'success')
      setStep('pay')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not create booking'
      toast(message, 'error')
    } finally {
      setCreating(false)
    }
  }

  async function onPaymentReady(secret: string) {
    setClientSecret(secret)
  }

  async function onPaymentSucceeded() {
    toast('Card charged — confirming booking with the hotel…', 'info')
    // Poll /bookings/me until status becomes confirmed (webhook) or timeout
    const id = bookingId ?? booking?.id
    if (!id) return

    const started = Date.now()
    while (Date.now() - started < 30_000) {
      try {
        const { bookings } = await getMyBookings()
        const latest = bookings.find((b) => b.id === id)
        if (latest) {
          setBooking(latest)
          if (latest.status === 'confirmed') {
            toast('Booking confirmed!', 'success')
            setStep('done')
            return
          }
          if (latest.status === 'cancelled') {
            toast('Payment failed or hold was cancelled. Please try again.', 'error')
            navigate('/rooms')
            return
          }
        }
      } catch {
        // keep polling
      }
      await new Promise((r) => setTimeout(r, 2000))
    }

    // Still pending after polling — show confirmation screen with pending status
    try {
      const { bookings } = await getMyBookings()
      const latest = bookings.find((b) => b.id === id)
      if (latest) setBooking(latest)
    } catch {
      // ignore
    }
    toast('Payment received. Confirmation may take a moment.', 'info')
    setStep('done')
  }

  const remainingLabel =
    remainingMs == null
      ? null
      : remainingMs <= 0
        ? 'Expired'
        : `${Math.floor(remainingMs / 60000)}:${String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0')} left to pay`

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to={`/rooms/${roomId}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guestsCount}`} className="text-sm text-accent hover:underline">
          ← Back to room
        </Link>
        <h1 className="mt-2 font-display text-3xl text-neutral-900">Complete your booking</h1>
        <p className="mt-1 text-neutral-600">
          {roomType?.name ?? 'Room'} · {formatStay(checkIn, checkOut)}
        </p>
      </div>

      <ol className="flex flex-wrap gap-2 text-xs" aria-label="Booking progress">
        {(['guests', 'review', 'pay', 'done'] as Step[]).map((s) => (
          <li
            key={s}
            aria-current={step === s ? 'step' : undefined}
            className={`rounded-full px-3 py-1 capitalize ${
              step === s ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            {s === 'done' ? 'confirmation' : s}
          </li>
        ))}
      </ol>

      {step === 'guests' && draft && (
        <form onSubmit={onGuestsSubmit} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-card sm:p-6">
          <h2 className="font-display text-xl">Guest details</h2>
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-600">Guest name</span>
            <input
              required
              id="guest-name"
              value={draft.guestName}
              onChange={(e) => patchDraft({ guestName: e.target.value })}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-600">Email</span>
            <input
              type="email"
              required
              id="guest-email"
              value={draft.guestEmail}
              onChange={(e) => patchDraft({ guestEmail: e.target.value })}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-600">Phone</span>
            <input
              id="guest-phone"
              value={draft.guestPhone}
              onChange={(e) => patchDraft({ guestPhone: e.target.value })}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          {roomType && (
            <GuestPromoCodeField
              code={promoCode}
              onCodeChange={setPromoCode}
              onValidPromo={setValidPromo}
              basePricePerNight={roomType.basePrice}
              checkIn={checkIn}
              checkOut={checkOut}
            />
          )}
          <button
            type="submit"
            className="w-full rounded-full bg-primary px-4 py-2.5 text-white hover:bg-primary-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:w-auto"
          >
            Continue to review
          </button>
        </form>
      )}

      {step === 'review' && draft && (
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-card sm:p-6">
          <h2 className="font-display text-xl">Review summary</h2>
          {roomQuery.isLoading && <p className="text-sm text-neutral-500">Loading room…</p>}
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-neutral-500">Room</dt>
              <dd className="font-medium text-neutral-900">
                {roomType?.name ?? '—'} · #{room?.roomNumber ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Stay</dt>
              <dd className="font-medium text-neutral-900">{formatStay(checkIn, checkOut)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Guests</dt>
              <dd className="font-medium text-neutral-900">{draft.guestsCount}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Guest</dt>
              <dd className="font-medium text-neutral-900">
                {draft.guestName} · {draft.guestEmail}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Promo</dt>
              <dd className="font-medium text-neutral-900">
                {draft.promoCode ?? 'None'}
                {validPromo ? ` (${validPromo.discountPercent}% off)` : ''}
              </dd>
            </div>
          </dl>

          {pricing && (
            <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>
                  {formatMoney(roomType!.basePrice)} × {pricing.nights} night
                  {pricing.nights === 1 ? '' : 's'}
                </span>
                <span>{formatMoney(pricing.subtotal)}</span>
              </div>
              {pricing.discount > 0 && (
                <div className="flex justify-between text-accent">
                  <span>Promo discount</span>
                  <span>−{formatMoney(pricing.discount)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-neutral-200 pt-2 font-semibold text-neutral-900">
                <span>Estimated total</span>
                <span className="text-accent">{formatMoney(pricing.total)}</span>
              </div>
            </div>
          )}

          <p className="text-sm text-neutral-500">
            Confirming creates a pending hold. You&apos;ll pay next — the booking becomes confirmed
            after payment is verified.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setStep('guests')}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Back
            </button>
            <button
              type="button"
              disabled={creating || !room}
              onClick={() => void onConfirmHold()}
              className="rounded-full bg-primary px-4 py-2 text-sm text-white hover:bg-primary-light disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              {creating ? 'Reserving…' : 'Confirm & continue to payment'}
            </button>
          </div>
        </div>
      )}

      {step === 'pay' && booking && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-warning">
            <span>
              Pending hold · {formatMoney(booking.totalPrice)} due
            </span>
            {remainingLabel && <span className="font-medium">{remainingLabel}</span>}
          </div>

          {!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? (
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
              Set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in `.env` to enable card payment.
            </div>
          ) : !clientSecret ? (
            <PaymentBootstrap
              bookingId={booking.id}
              expiresAt={booking.expiresAt}
              onReady={onPaymentReady}
              onExpired={() => {
                toast('Your booking hold expired. Please search again.', 'error')
                clear()
                navigate('/rooms')
              }}
            />
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <GuestPaymentForm
                amount={booking.totalPrice}
                onSuccess={() => void onPaymentSucceeded()}
                onError={(msg) => toast(msg, 'error')}
              />
            </Elements>
          )}
        </div>
      )}

      {step === 'done' && booking && (
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-card">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl text-neutral-900">Booking status</h2>
            <StatusBadge status={booking.status} />
          </div>

          {booking.status === 'confirmed' ? (
            <p className="text-neutral-600">
              You’re all set. A confirmation email will follow shortly.
            </p>
          ) : booking.status === 'pending' ? (
            <p className="text-warning">
              Payment was submitted, but the hotel is still confirming it. This page reflects the
              live booking status — refresh your bookings in a moment if it stays pending.
            </p>
          ) : (
            <p className="text-neutral-600">Current status: {booking.status}</p>
          )}

          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-neutral-500">Booking ID</dt>
              <dd className="font-mono text-neutral-900">{booking.id}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Total</dt>
              <dd className="font-medium text-accent">{formatMoney(booking.totalPrice)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Stay</dt>
              <dd>{formatStay(booking.checkIn, booking.checkOut)}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/my-bookings/${booking.id}`}
              className="rounded-full bg-primary px-4 py-2 text-sm text-white hover:bg-primary-light"
              onClick={() => clear()}
            >
              View booking
            </Link>
            <Link
              to="/my-bookings"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700"
              onClick={() => clear()}
            >
              My bookings
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function PaymentBootstrap({
  bookingId,
  expiresAt,
  onReady,
  onExpired,
}: {
  bookingId: string
  expiresAt: string | null
  onReady: (secret: string) => void
  onExpired: () => void
}) {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (isBookingExpired(expiresAt)) {
        onExpired()
        return
      }
      try {
        const intent = await createPaymentIntent(bookingId)
        if (!cancelled) {
          if (!intent.clientSecret) throw new Error('Missing client secret')
          onReady(intent.clientSecret)
        }
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Could not start payment'
        if (message.toLowerCase().includes('expired')) {
          onExpired()
          return
        }
        if (!cancelled) setError(message)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [bookingId, expiresAt, onReady, onExpired])

  if (error) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
        {error}
      </div>
    )
  }

  return <PaymentSkeleton />
}
