import request from 'supertest';
import { BookingStatus, PaymentStatus, UserRole } from '@prisma/client';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import { hashPassword } from '../src/utils/password';
import { signAccessToken } from '../src/utils/jwt';
import {
  percentChange,
  previousEqualLengthRange,
} from '../src/services/report.service';

const app = createApp();

async function createAdmin() {
  const user = await prisma.user.create({
    data: {
      name: 'Admin',
      email: `admin-trends-${Date.now()}@example.com`,
      passwordHash: await hashPassword('password123'),
      role: UserRole.admin,
    },
  });
  const token = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  return { user, token };
}

async function seedRoom() {
  const roomType = await prisma.roomType.create({
    data: { name: 'Standard', basePrice: 100, capacity: 2, amenities: [], images: [] },
  });
  const room = await prisma.room.create({
    data: { roomTypeId: roomType.id, roomNumber: '301', floor: 3, status: 'available' },
  });
  return { roomType, room };
}

describe('previousEqualLengthRange / percentChange helpers', () => {
  it('computes an equal-length prior window ending the day before from', () => {
    const start = new Date('2026-02-01T00:00:00.000Z');
    const end = new Date('2026-02-07T23:59:59.999Z');
    const prev = previousEqualLengthRange(start, end);

    expect(prev.start.toISOString().slice(0, 10)).toBe('2026-01-25');
    expect(prev.end.toISOString().slice(0, 10)).toBe('2026-01-31');
  });

  it('computes percent change with one decimal; null when previous is 0', () => {
    expect(percentChange(32800, 24460)).toBe(34.1);
    expect(percentChange(80, 100)).toBe(-20);
    expect(percentChange(50, 0)).toBeNull();
    expect(percentChange(0, 0)).toBeNull();
  });
});

describe('GET /api/reports/revenue previous-period trends', () => {
  it('returns activity KPIs and correct percent changes vs prior equal-length period', async () => {
    const { token, user } = await createAdmin();
    const { room } = await seedRoom();

    // Current window: 2026-02-01 .. 2026-02-07 (7 days)
    // Previous window: 2026-01-25 .. 2026-01-31

    // Previous period: $200 revenue, 2 new bookings, 1 check-in, 1 check-out
    const prevBookingA = await prisma.booking.create({
      data: {
        userId: user.id,
        roomId: room.id,
        checkIn: new Date('2026-01-26T00:00:00.000Z'),
        checkOut: new Date('2026-01-28T00:00:00.000Z'),
        status: BookingStatus.checked_out,
        totalPrice: 200,
        guestsCount: 1,
        createdAt: new Date('2026-01-25T12:00:00.000Z'),
      },
    });
    await prisma.payment.create({
      data: {
        bookingId: prevBookingA.id,
        amount: 200,
        status: PaymentStatus.paid,
        createdAt: new Date('2026-01-25T12:05:00.000Z'),
      },
    });
    await prisma.booking.create({
      data: {
        userId: user.id,
        roomId: room.id,
        checkIn: new Date('2026-03-01T00:00:00.000Z'),
        checkOut: new Date('2026-03-03T00:00:00.000Z'),
        status: BookingStatus.confirmed,
        totalPrice: 200,
        guestsCount: 1,
        createdAt: new Date('2026-01-30T10:00:00.000Z'),
      },
    });

    // Current period: $500 revenue, 3 new bookings, 2 check-ins, 0 check-outs
    // Revenue change: (500-200)/200 = 150%
    // New bookings: (3-2)/2 = 50%
    // Check-ins: (2-1)/1 = 100%
    // Check-outs: (0-1)/1 = -100%
    const curBooking1 = await prisma.booking.create({
      data: {
        userId: user.id,
        roomId: room.id,
        checkIn: new Date('2026-02-02T00:00:00.000Z'),
        checkOut: new Date('2026-02-10T00:00:00.000Z'),
        status: BookingStatus.checked_in,
        totalPrice: 300,
        guestsCount: 1,
        createdAt: new Date('2026-02-01T09:00:00.000Z'),
      },
    });
    await prisma.payment.create({
      data: {
        bookingId: curBooking1.id,
        amount: 300,
        status: PaymentStatus.paid,
        createdAt: new Date('2026-02-01T09:05:00.000Z'),
      },
    });
    const curBooking2 = await prisma.booking.create({
      data: {
        userId: user.id,
        roomId: room.id,
        checkIn: new Date('2026-02-05T00:00:00.000Z'),
        checkOut: new Date('2026-02-12T00:00:00.000Z'),
        status: BookingStatus.confirmed,
        totalPrice: 200,
        guestsCount: 2,
        createdAt: new Date('2026-02-03T11:00:00.000Z'),
      },
    });
    await prisma.payment.create({
      data: {
        bookingId: curBooking2.id,
        amount: 200,
        status: PaymentStatus.paid,
        createdAt: new Date('2026-02-03T11:05:00.000Z'),
      },
    });
    await prisma.booking.create({
      data: {
        userId: user.id,
        roomId: room.id,
        checkIn: new Date('2026-04-01T00:00:00.000Z'),
        checkOut: new Date('2026-04-02T00:00:00.000Z'),
        status: BookingStatus.pending,
        totalPrice: 100,
        guestsCount: 1,
        createdAt: new Date('2026-02-06T08:00:00.000Z'),
        expiresAt: new Date('2026-02-06T09:00:00.000Z'),
      },
    });

    const res = await request(app)
      .get('/api/reports/revenue')
      .query({ from: '2026-02-01', to: '2026-02-07' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.totalRevenue).toBe(500);
    expect(res.body.newBookings).toBe(3);
    expect(res.body.checkIns).toBe(2);
    expect(res.body.checkOuts).toBe(0);

    expect(res.body.previousPeriod).toEqual({
      from: '2026-01-25',
      to: '2026-01-31',
      totalRevenue: 200,
      newBookings: 2,
      checkIns: 1,
      checkOuts: 1,
    });

    expect(res.body.changes).toEqual({
      totalRevenuePercent: 150,
      newBookingsPercent: 50,
      checkInsPercent: 100,
      checkOutsPercent: -100,
    });

    expect(res.body.bookingsByRoomType).toEqual([
      {
        roomTypeId: expect.any(String),
        roomTypeName: 'Standard',
        bookings: 3,
      },
    ]);
  });

  it('returns bookingsByRoomType counts that sum to newBookings', async () => {
    const { token, user } = await createAdmin();
    const standard = await prisma.roomType.create({
      data: { name: 'Standard', basePrice: 100, capacity: 2, amenities: [], images: [] },
    });
    const suite = await prisma.roomType.create({
      data: { name: 'Suite', basePrice: 250, capacity: 4, amenities: [], images: [] },
    });
    const roomA = await prisma.room.create({
      data: { roomTypeId: standard.id, roomNumber: '101', floor: 1, status: 'available' },
    });
    const roomB = await prisma.room.create({
      data: { roomTypeId: suite.id, roomNumber: '501', floor: 5, status: 'available' },
    });

    await prisma.booking.createMany({
      data: [
        {
          userId: user.id,
          roomId: roomA.id,
          checkIn: new Date('2026-03-10T00:00:00.000Z'),
          checkOut: new Date('2026-03-12T00:00:00.000Z'),
          status: BookingStatus.confirmed,
          totalPrice: 200,
          guestsCount: 1,
          createdAt: new Date('2026-03-01T10:00:00.000Z'),
        },
        {
          userId: user.id,
          roomId: roomA.id,
          checkIn: new Date('2026-03-14T00:00:00.000Z'),
          checkOut: new Date('2026-03-15T00:00:00.000Z'),
          status: BookingStatus.confirmed,
          totalPrice: 100,
          guestsCount: 1,
          createdAt: new Date('2026-03-02T10:00:00.000Z'),
        },
        {
          userId: user.id,
          roomId: roomB.id,
          checkIn: new Date('2026-03-20T00:00:00.000Z'),
          checkOut: new Date('2026-03-22T00:00:00.000Z'),
          status: BookingStatus.confirmed,
          totalPrice: 500,
          guestsCount: 2,
          createdAt: new Date('2026-03-03T10:00:00.000Z'),
        },
      ],
    });

    const res = await request(app)
      .get('/api/reports/revenue')
      .query({ from: '2026-03-01', to: '2026-03-07' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.newBookings).toBe(3);
    expect(res.body.bookingsByRoomType).toEqual([
      { roomTypeId: standard.id, roomTypeName: 'Standard', bookings: 2 },
      { roomTypeId: suite.id, roomTypeName: 'Suite', bookings: 1 },
    ]);
    const sum = res.body.bookingsByRoomType.reduce(
      (acc: number, row: { bookings: number }) => acc + row.bookings,
      0,
    );
    expect(sum).toBe(res.body.newBookings);
  });

  it('blocks staff from revenue reports (RBAC unchanged)', async () => {
    const staff = await prisma.user.create({
      data: {
        name: 'Staff',
        email: `staff-rev-${Date.now()}@example.com`,
        passwordHash: await hashPassword('password123'),
        role: UserRole.staff,
      },
    });
    const token = signAccessToken({
      sub: staff.id,
      email: staff.email,
      role: staff.role,
    });

    await request(app)
      .get('/api/reports/revenue')
      .query({ from: '2026-02-01', to: '2026-02-07' })
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
