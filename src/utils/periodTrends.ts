import { differenceInCalendarDays, parseISO } from 'date-fns'

/** Human label for the equal-length prior window (matches selected range length). */
export function previousPeriodChangeSuffix(from: string, to: string): string {
  const days = differenceInCalendarDays(parseISO(to), parseISO(from)) + 1
  if (days === 1) return 'from yesterday'
  if (days === 7) return 'from last week'
  if (days === 30 || days === 31) return 'from last 30 days'
  return 'from previous period'
}
