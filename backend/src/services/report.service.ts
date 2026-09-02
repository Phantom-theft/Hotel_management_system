import { BookingStatus, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/helpers';
import { calculateNights, decimalToNumber, parseDateParam } from '../utils/booking';

function parseRange(from?: string, to?: string) {
  if (!from || !to) {
    throw new AppError(400, 'from and to query params are required (ISO dates)');
  }
  const start = parseDateParam(from, 'from');
  start.setUTCHours(0, 0, 0, 0);
  const end = parseDateParam(to, 'to');
  end.setUTCHours(23, 59, 59, 999);
  if (end < start) {
    throw new AppError(400, 'to must be on or after from');
  }
  return { start, end };
}

function eachUtcDay(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  while (cursor <= last) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/**
 * Occupancy for confirmed+ bookings only (pending unpaid holds excluded).
 * A room is occupied on a day if a booking covers that calendar day
 * (checkIn <= day < checkOut).
 */
export async function getOccupancyReport(from?: string, to?: string) {
  const { start, end } = parseRange(from, to);
  const totalRooms = await prisma.room.count();
  if (totalRooms === 0) {
    return { from: start.toISOString(), to: end.toISOString(), totalRooms: 0, days: [], overallOccupancyRate: 0 };
  }

  const bookings = await prisma.booking.findMany({
    where: {
      status: {
        in: [BookingStatus.confirmed, BookingStatus.checked_in, BookingStatus.checked_out],
      },
      checkIn: { lt: end },
      checkOut: { gt: start },
    },
    select: { roomId: true, checkIn: true, checkOut: true },
  });

  const days = eachUtcDay(start, end).map((day) => {
    const next = new Date(day);
    next.setUTCDate(next.getUTCDate() + 1);
    const occupiedRoomIds = new Set<string>();
    for (const b of bookings) {
      if (b.checkIn < next && b.checkOut > day) {
        occupiedRoomIds.add(b.roomId);
      }
    }
    const occupiedRooms = occupiedRoomIds.size;
    return {
      date: day.toISOString().slice(0, 10),
      occupiedRooms,
      totalRooms,
      occupancyRate: Number(((occupiedRooms / totalRooms) * 100).toFixed(2)),
    };
  });

  const avg =
    days.length === 0
      ? 0
      : Number((days.reduce((sum, d) => sum + d.occupancyRate, 0) / days.length).toFixed(2));

  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
    totalRooms,
    overallOccupancyRate: avg,
    days,
  };
}

/** Revenue from paid Payment records only (not booking.totalPrice). */
export async function getRevenueReport(from?: string, to?: string) {
  const { start, end } = parseRange(from, to);

  const payments = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.paid,
      createdAt: { gte: start, lte: end },
    },
    include: {
      booking: {
        include: {
          room: { include: { roomType: true } },
        },
      },
    },
  });

  let totalRevenue = new Prisma.Decimal(0);
  let roomNightsSold = 0;
  const countedBookingIds = new Set<string>();
  const byRoomType = new Map<string, { roomTypeId: string; roomTypeName: string; revenue: Prisma.Decimal }>();
  const byDay = new Map<string, Prisma.Decimal>();

  for (const payment of payments) {
    totalRevenue = totalRevenue.add(payment.amount);
    if (!countedBookingIds.has(payment.bookingId)) {
      countedBookingIds.add(payment.bookingId);
      roomNightsSold += calculateNights(payment.booking.checkIn, payment.booking.checkOut);
    }
    const day = payment.createdAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? new Prisma.Decimal(0)).add(payment.amount));

    const rt = payment.booking.room.roomType;
    const existing = byRoomType.get(rt.id) ?? {
      roomTypeId: rt.id,
      roomTypeName: rt.name,
      revenue: new Prisma.Decimal(0),
    };
    existing.revenue = existing.revenue.add(payment.amount);
    byRoomType.set(rt.id, existing);
  }

  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
    totalRevenue: decimalToNumber(totalRevenue),
    roomNightsSold,
    byPeriod: [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue: decimalToNumber(revenue) })),
    byRoomType: [...byRoomType.values()].map((r) => ({
      roomTypeId: r.roomTypeId,
      roomTypeName: r.roomTypeName,
      revenue: decimalToNumber(r.revenue),
    })),
  };
}

export async function getCancellationsReport(from?: string, to?: string) {
  const { start, end } = parseRange(from, to);

  const bookings = await prisma.booking.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: { status: true, createdAt: true },
  });

  const byDay = new Map<string, { total: number; cancelled: number }>();
  for (const b of bookings) {
    const day = b.createdAt.toISOString().slice(0, 10);
    const bucket = byDay.get(day) ?? { total: 0, cancelled: 0 };
    bucket.total += 1;
    if (b.status === BookingStatus.cancelled) {
      bucket.cancelled += 1;
    }
    byDay.set(day, bucket);
  }

  const total = bookings.length;
  const cancelled = bookings.filter((b) => b.status === BookingStatus.cancelled).length;

  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
    totalBookings: total,
    cancelledBookings: cancelled,
    cancellationRate: total === 0 ? 0 : Number(((cancelled / total) * 100).toFixed(2)),
    byPeriod: [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        total: stats.total,
        cancelled: stats.cancelled,
        cancellationRate:
          stats.total === 0 ? 0 : Number(((stats.cancelled / stats.total) * 100).toFixed(2)),
      })),
  };
}
