import { BookingStatus, Prisma } from '@prisma/client';

/**
 * Prisma filter for bookings that currently hold inventory for a date range.
 *
 * A booking blocks a room when:
 * - status is not cancelled
 * - dates overlap (existingCheckIn < rangeEnd AND existingCheckOut > rangeStart)
 * - AND it is NOT an expired pending hold (pending + expiresAt <= now)
 *
 * Expired pending bookings are ignored so unpaid holds do not lock rooms forever.
 * Confirmed / checked_in / checked_out always block (expiresAt is cleared on confirm).
 */
export function blockingOverlapWhere(
  rangeStart: Date,
  rangeEnd: Date,
  now: Date = new Date(),
): Prisma.BookingWhereInput {
  return {
    status: { not: BookingStatus.cancelled },
    checkIn: { lt: rangeEnd },
    checkOut: { gt: rangeStart },
    OR: [
      { status: { not: BookingStatus.pending } },
      { expiresAt: null },
      { expiresAt: { gt: now } },
    ],
  };
}
