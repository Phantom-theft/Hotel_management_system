/** Hospitality KPI helpers used on the admin dashboard. */
export function computeAdr(totalRevenue: number, roomNightsSold: number): number | null {
  if (totalRevenue <= 0 || roomNightsSold <= 0) return null
  return totalRevenue / roomNightsSold
}

/** RevPAR = total room revenue ÷ total room inventory (room count). */
export function computeRevpar(totalRevenue: number, totalRooms: number): number | null {
  if (totalRevenue <= 0 || totalRooms <= 0) return null
  return totalRevenue / totalRooms
}

export function formatHospitalityCurrency(value: number | null): string {
  return value == null ? '—' : `$${value.toFixed(2)}`
}
