import { useEffect, useState } from 'react'
import { validatePromoCode } from '../../api/hotel'
import { formatMoney, nightsBetween } from '../../utils/bookingFormat'

interface GuestPromoCodeFieldProps {
  code: string
  onCodeChange: (code: string) => void
  onValidPromo: (promo: { code: string; discountPercent: number } | null) => void
  basePricePerNight: number
  checkIn: string
  checkOut: string
}

export function GuestPromoCodeField({
  code,
  onCodeChange,
  onValidPromo,
  basePricePerNight,
  checkIn,
  checkOut,
}: GuestPromoCodeFieldProps) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [discountPercent, setDiscountPercent] = useState<number | null>(null)

  useEffect(() => {
    const trimmed = code.trim()
    if (!trimmed) {
      setStatus('idle')
      setMessage(null)
      setDiscountPercent(null)
      onValidPromo(null)
      return
    }

    setStatus('checking')
    const timer = window.setTimeout(() => {
      void validatePromoCode(trimmed)
        .then((result) => {
          if (result.valid) {
            setStatus('valid')
            setDiscountPercent(result.discountPercent)
            setMessage(`${result.discountPercent}% off applied to preview`)
            onValidPromo({ code: trimmed.toUpperCase(), discountPercent: result.discountPercent })
          } else {
            setStatus('invalid')
            setDiscountPercent(null)
            setMessage('Invalid or unavailable promo code')
            onValidPromo(null)
          }
        })
        .catch((err: unknown) => {
          setStatus('invalid')
          setDiscountPercent(null)
          const msg =
            (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            'Invalid or unavailable promo code'
          setMessage(msg)
          onValidPromo(null)
        })
    }, 400)

    return () => window.clearTimeout(timer)
  }, [code, onValidPromo])

  const nights = nightsBetween(checkIn, checkOut)
  const subtotal = basePricePerNight * nights
  const discount =
    discountPercent != null ? subtotal * (discountPercent / 100) : 0
  const total = subtotal - discount

  return (
    <div className="space-y-2">
      <label className="block text-sm">
        <span className="mb-1 block text-neutral-600">Promo code (optional)</span>
        <div className="flex gap-2">
          <input
            id="promo-code"
            value={code}
            onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
            autoComplete="off"
            spellCheck={false}
            placeholder="e.g. WELCOME10"
            aria-describedby={message ? 'promo-status' : undefined}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 uppercase"
          />
          {status === 'checking' && (
            <span className="self-center text-xs text-neutral-500">Checking…</span>
          )}
        </div>
      </label>

      {message && (
        <p
          id="promo-status"
          role="status"
          className={`text-sm ${status === 'valid' ? 'text-accent' : status === 'invalid' ? 'text-danger' : 'text-neutral-500'}`}
        >
          {message}
        </p>
      )}

      {status === 'valid' && discountPercent != null && (
        <div className="rounded-lg border border-accent/20 bg-surface-tint/60 px-3 py-2 text-sm">
          <div className="flex justify-between text-neutral-600">
            <span>Subtotal ({nights} night{nights === 1 ? '' : 's'})</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between text-accent">
            <span>Promo discount ({discountPercent}%)</span>
            <span>−{formatMoney(discount)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-accent/20 pt-1 font-medium text-neutral-900">
            <span>Estimated total</span>
            <span>{formatMoney(total)}</span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Final amount is confirmed when your hold is created.
          </p>
        </div>
      )}
    </div>
  )
}
