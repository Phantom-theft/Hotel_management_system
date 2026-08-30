import { useState, type FormEvent } from 'react'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { formatMoney } from '../utils/bookingFormat'

interface PaymentFormProps {
  amount: number
  onSuccess: () => void
  onError: (message: string) => void
}

export function PaymentForm({ amount, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/my-bookings`,
        },
      })

      if (result.error) {
        onError(result.error.message ?? 'Payment failed')
        return
      }

      const status = result.paymentIntent?.status
      if (status === 'succeeded' || status === 'processing') {
        onSuccess()
      } else {
        onError(`Unexpected payment status: ${status ?? 'unknown'}`)
      }
    } catch {
      onError('Payment could not be completed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-neutral-100 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Payment</h2>
        <p className="text-sm font-medium text-accent">{formatMoney(amount)}</p>
      </div>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-full bg-primary px-4 py-2.5 font-semibold text-white transition hover:bg-primary-light disabled:opacity-60"
      >
        {submitting ? 'Processing…' : `Pay ${formatMoney(amount)}`}
      </button>
      <p className="text-xs text-neutral-500">
        Your card is processed by Stripe. The booking is confirmed after the hotel receives the
        payment webhook.
      </p>
    </form>
  )
}
