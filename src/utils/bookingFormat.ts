function nightsBetween(checkIn: string, checkOut: string) {
  const a = new Date(checkIn)
  const b = new Date(checkOut)
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)))
}

export function formatMoney(amount: number) {
  return `$${amount.toFixed(2)}`
}

export function formatStay(checkIn: string, checkOut: string) {
  const nights = nightsBetween(checkIn.slice(0, 10), checkOut.slice(0, 10))
  return `${checkIn.slice(0, 10)} → ${checkOut.slice(0, 10)} · ${nights} night${nights === 1 ? '' : 's'}`
}

export function isBookingExpired(expiresAt: string | null | undefined) {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() <= Date.now()
}

export function msUntil(expiresAt: string | null | undefined) {
  if (!expiresAt) return null
  return new Date(expiresAt).getTime() - Date.now()
}

export { nightsBetween }
