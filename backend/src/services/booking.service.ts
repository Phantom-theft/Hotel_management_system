import { BookingStatus, Prisma, RoomStatus, UserRole } from '@prisma/client';
import crypto from 'crypto';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { AppError } from '../utils/helpers';
import { blockingOverlapWhere } from '../utils/availability';
import {
  assertValidStayRange,
  calculateNights,
  calculateTotalPrice,
  decimalToNumber,
  parseDateParam,
} from '../utils/booking';
import { hashPassword } from '../utils/password';
import { serializeRoom } from './room.service';
import { writeAuditLog } from './audit.service';
import {
  sendBookingCancellationEmail,
  sendBookingConfirmationEmail,
} from './email.service';
import { reservePromoCode } from './promoCode.service';

export interface CreateBookingInput {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  promoCode?: string;
}

export interface WalkInBookingInput extends CreateBookingInput {
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
}

function serializeBooking(booking: {
  id: string;
  userId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  status: BookingStatus;
  totalPrice: Prisma.Decimal;
  guestsCount: number;
  expiresAt: Date | null;
  createdAt: Date;
  room?: Parameters<typeof serializeRoom>[0];
}) {
  return {
    id: booking.id,
    userId: booking.userId,
    roomId: booking.roomId,
    checkIn: booking.checkIn.toISOString(),
    checkOut: booking.checkOut.toISOString(),
    status: booking.status,
    totalPrice: decimalToNumber(booking.totalPrice),
    guestsCount: booking.guestsCount,
    expiresAt: booking.expiresAt?.toISOString() ?? null,
    createdAt: booking.createdAt.toISOString(),
    ...(booking.room ? { room: serializeRoom(booking.room) } : {}),
  };
}

async function assertRoomAvailableForStay(
  tx: Prisma.TransactionClient,
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  guestsCount: number,
) {
  const lockedRooms = await tx.$queryRaw<{ id: string; status: RoomStatus }[]>`
    SELECT id, status FROM rooms WHERE id = ${roomId} FOR UPDATE
  `;

  if (lockedRooms.length === 0) {
    throw new AppError(404, 'Room not found');
  }

  if (lockedRooms[0].status === RoomStatus.maintenance) {
    throw new AppError(409, 'Room is under maintenance');
  }

  const room = await tx.room.findUniqueOrThrow({
    where: { id: roomId },
    include: { roomType: true },
  });

  if (guestsCount > room.roomType.capacity) {
    throw new AppError(400, `Room capacity is ${room.roomType.capacity} guests`);
  }

  const overlapping = await tx.booking.findFirst({
    where: {
      roomId,
      ...blockingOverlapWhere(checkIn, checkOut),
    },
  });

  if (overlapping) {
    throw new AppError(409, 'Room is not available for the selected dates');
  }

  return room;
}

/** Online booking: pending until Stripe payment succeeds; holds room until expiresAt. */
export async function createBooking(userId: string, input: CreateBookingInput) {
  if (!input.roomId) {
    throw new AppError(400, 'roomId is required');
  }
  if (!input.checkIn || !input.checkOut) {
    throw new AppError(400, 'checkIn and checkOut are required');
  }
  if (!input.guestsCount || input.guestsCount < 1) {
    throw new AppError(400, 'guestsCount must be at least 1');
  }

  const checkIn = parseDateParam(input.checkIn, 'checkIn');
  const checkOut = parseDateParam(input.checkOut, 'checkOut');
  assertValidStayRange(checkIn, checkOut);
  const nights = calculateNights(checkIn, checkOut);
  const expiresAt = new Date(Date.now() + env.bookingPendingTtlMinutes * 60 * 1000);

  const booking = await prisma.$transaction(async (tx) => {
    const room = await assertRoomAvailableForStay(tx, input.roomId, checkIn, checkOut, input.guestsCount);
    let totalPrice = calculateTotalPrice(room.roomType.basePrice, nights);
    if (input.promoCode) {
      const promo = await reservePromoCode(tx, input.promoCode);
      const multiplier = (100 - promo.discountPercent) / 100;
      totalPrice = totalPrice.mul(multiplier);
    }

    return tx.booking.create({
      data: {
        userId,
        roomId: input.roomId,
        checkIn,
        checkOut,
        guestsCount: input.guestsCount,
        totalPrice,
        status: BookingStatus.pending,
        expiresAt,
      },
      include: {
        room: { include: { roomType: true } },
      },
    });
  });

  return serializeBooking(booking);
}

/**
 * Walk-in: staff creates booking on behalf of a guest who pays at the desk.
 * Goes straight to confirmed — legitimate exception to pending-first because
 * there is no online PaymentIntent; payment is handled offline by staff.
 */
export async function createWalkInBooking(staffUserId: string, input: WalkInBookingInput) {
  if (!input.guestName?.trim() || !input.guestEmail?.trim()) {
    throw new AppError(400, 'guestName and guestEmail are required');
  }
  if (!input.roomId || !input.checkIn || !input.checkOut) {
    throw new AppError(400, 'roomId, checkIn, and checkOut are required');
  }
  if (!input.guestsCount || input.guestsCount < 1) {
    throw new AppError(400, 'guestsCount must be at least 1');
  }

  const checkIn = parseDateParam(input.checkIn, 'checkIn');
  const checkOut = parseDateParam(input.checkOut, 'checkOut');
  assertValidStayRange(checkIn, checkOut);
  const nights = calculateNights(checkIn, checkOut);

  const booking = await prisma.$transaction(async (tx) => {
    const room = await assertRoomAvailableForStay(tx, input.roomId, checkIn, checkOut, input.guestsCount);
    const totalPrice = calculateTotalPrice(room.roomType.basePrice, nights);

    let guest = await tx.user.findUnique({
      where: { email: input.guestEmail.toLowerCase() },
    });

    if (!guest) {
      guest = await tx.user.create({
        data: {
          name: input.guestName.trim(),
          email: input.guestEmail.toLowerCase(),
          phone: input.guestPhone,
          passwordHash: await hashPassword(crypto.randomBytes(24).toString('hex')),
          role: UserRole.customer,
        },
      });
    }

    const created = await tx.booking.create({
      data: {
        userId: guest.id,
        roomId: input.roomId,
        checkIn,
        checkOut,
        guestsCount: input.guestsCount,
        totalPrice,
        status: BookingStatus.confirmed,
        expiresAt: null,
      },
      include: {
        room: { include: { roomType: true } },
        user: true,
      },
    });

    // Record desk payment as paid so revenue reports include walk-ins
    await tx.payment.create({
      data: {
        bookingId: created.id,
        amount: totalPrice,
        status: 'paid',
        stripePaymentId: null,
      },
    });

    return created;
  });

  await writeAuditLog({
    userId: staffUserId,
    action: 'booking.walk_in_created',
    targetType: 'Booking',
    targetId: booking.id,
  });

  try {
    await sendBookingConfirmationEmail({
      to: booking.user.email,
      guestName: booking.user.name,
      bookingId: booking.id,
      roomNumber: booking.room.roomNumber,
      checkIn: booking.checkIn.toISOString().slice(0, 10),
      checkOut: booking.checkOut.toISOString().slice(0, 10),
      totalPrice: decimalToNumber(booking.totalPrice).toFixed(2),
    });
  } catch (err) {
    console.error('Failed to send walk-in confirmation email', err);
  }

  return serializeBooking(booking);
}

export async function listMyBookings(userId: string) {
  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: { room: { include: { roomType: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return bookings.map(serializeBooking);
}

export async function cancelBooking(
  actorUserId: string,
  bookingId: string,
  options?: { asStaff?: boolean },
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { room: true, user: true },
  });
  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  if (!options?.asStaff && booking.userId !== actorUserId) {
    throw new AppError(403, 'You can only cancel your own bookings');
  }

  if (booking.status === BookingStatus.cancelled) {
    throw new AppError(409, 'Booking is already cancelled');
  }

  if (
    booking.status === BookingStatus.checked_in ||
    booking.status === BookingStatus.checked_out
  ) {
    throw new AppError(409, 'Cannot cancel a booking that is checked in or checked out');
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.cancelled, expiresAt: null },
    include: { room: { include: { roomType: true } }, user: true },
  });

  if (options?.asStaff) {
    await writeAuditLog({
      userId: actorUserId,
      action: 'booking.staff_cancelled',
      targetType: 'Booking',
      targetId: bookingId,
    });
  }

  try {
    await sendBookingCancellationEmail({
      to: updated.user.email,
      guestName: updated.user.name,
      bookingId: updated.id,
      roomNumber: updated.room.roomNumber,
      checkIn: updated.checkIn.toISOString().slice(0, 10),
      checkOut: updated.checkOut.toISOString().slice(0, 10),
    });
  } catch (err) {
    console.error('Failed to send cancellation email', err);
  }

  return serializeBooking(updated);
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function endOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

/** Today's check-ins and check-outs for confirmed (paid) bookings only. */
export async function getTodaysArrivalsAndDepartures(date = new Date()) {
  const dayStart = startOfUtcDay(date);
  const dayEnd = endOfUtcDay(date);

  const activeStatuses: BookingStatus[] = [
    BookingStatus.confirmed,
    BookingStatus.checked_in,
    BookingStatus.checked_out,
  ];

  const [checkIns, checkOuts] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: { in: activeStatuses },
        checkIn: { gte: dayStart, lte: dayEnd },
      },
      include: { room: { include: { roomType: true } }, user: true },
      orderBy: { checkIn: 'asc' },
    }),
    prisma.booking.findMany({
      where: {
        status: { in: activeStatuses },
        checkOut: { gte: dayStart, lte: dayEnd },
      },
      include: { room: { include: { roomType: true } }, user: true },
      orderBy: { checkOut: 'asc' },
    }),
  ]);

  return {
    date: dayStart.toISOString().slice(0, 10),
    checkIns: checkIns.map(serializeBooking),
    checkOuts: checkOuts.map(serializeBooking),
  };
}

export async function checkInBooking(staffUserId: string, bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }
  if (booking.status !== BookingStatus.confirmed) {
    throw new AppError(409, 'Only confirmed bookings can be checked in');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.checked_in },
      include: { room: { include: { roomType: true } } },
    });
    await tx.room.update({
      where: { id: booking.roomId },
      data: { status: RoomStatus.occupied },
    });
    return result;
  });

  await writeAuditLog({
    userId: staffUserId,
    action: 'booking.check_in',
    targetType: 'Booking',
    targetId: bookingId,
  });

  return serializeBooking(updated);
}

export async function checkOutBooking(staffUserId: string, bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }
  if (booking.status !== BookingStatus.checked_in) {
    throw new AppError(409, 'Only checked-in bookings can be checked out');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.checked_out },
      include: { room: { include: { roomType: true } } },
    });
    await tx.room.update({
      where: { id: booking.roomId },
      data: { status: RoomStatus.available },
    });
    return result;
  });

  await writeAuditLog({
    userId: staffUserId,
    action: 'booking.check_out',
    targetType: 'Booking',
    targetId: bookingId,
  });

  return serializeBooking(updated);
}

export { serializeBooking };
