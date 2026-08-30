import request from 'supertest';
import { BookingStatus, UserRole } from '@prisma/client';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import { hashPassword } from '../src/utils/password';
import { signAccessToken } from '../src/utils/jwt';
import { datesOverlap, calculateNights, calculateTotalPrice } from '../src/utils/booking';
import * as bookingService from '../src/services/booking.service';

const app = createApp();

async function createUser(role: UserRole, email: string) {
  const user = await prisma.user.create({
    data: {
      name: `${role} User`,
      email,
      passwordHash: await hashPassword('password123'),
      role,
    },
  });
  const token = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  return { user, token };
}

async function seedRoom(basePrice = 100, capacity = 2) {
  const roomType = await prisma.roomType.create({
    data: {
      name: 'Deluxe',
      basePrice,
      capacity,
      amenities: ['wifi'],
      images: [],
    },
  });

  const room = await prisma.room.create({
    data: {
      roomTypeId: roomType.id,
      roomNumber: '101',
      floor: 1,
      status: 'available',
    },
  });

  return { roomType, room };
}

describe('datesOverlap helper', () => {
  const jan1 = new Date('2026-01-01');
  const jan5 = new Date('2026-01-05');
  const jan10 = new Date('2026-01-10');
  const jan15 = new Date('2026-01-15');

  it('detects overlapping ranges (existing starts before new ends)', () => {
    expect(datesOverlap(jan1, jan10, jan5, jan15)).toBe(true);
  });

  it('detects when new stay is fully inside existing', () => {
    expect(datesOverlap(jan1, jan15, jan5, jan10)).toBe(true);
  });

  it('detects when existing stay is fully inside new', () => {
    expect(datesOverlap(jan5, jan10, jan1, jan15)).toBe(true);
  });

  it('allows adjacent stays (checkout == next checkin)', () => {
    expect(datesOverlap(jan1, jan5, jan5, jan10)).toBe(false);
  });

  it('allows completely separate ranges', () => {
    expect(datesOverlap(jan1, jan5, jan10, jan15)).toBe(false);
  });
});

describe('price calculation', () => {
  it('charges basePrice × nights', () => {
    const nights = calculateNights(new Date('2026-03-01'), new Date('2026-03-04'));
    expect(nights).toBe(3);
    expect(Number(calculateTotalPrice(120, nights))).toBe(360);
  });
});

describe('RoomType & Room admin CRUD', () => {
  it('allows admin to create room type and room', async () => {
    const { token } = await createUser(UserRole.admin, 'admin@example.com');

    const typeRes = await request(app)
      .post('/api/room-types')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Suite',
        basePrice: 250,
        capacity: 4,
        amenities: ['wifi', 'minibar'],
      })
      .expect(201);

    expect(typeRes.body.roomType.name).toBe('Suite');
    expect(typeRes.body.roomType.basePrice).toBe(250);

    const roomRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        roomTypeId: typeRes.body.roomType.id,
        roomNumber: '501',
        floor: 5,
      })
      .expect(201);

    expect(roomRes.body.room.roomNumber).toBe('501');
  });

  it('blocks customer from creating room types', async () => {
    const { token } = await createUser(UserRole.customer, 'cust@example.com');

    await request(app)
      .post('/api/room-types')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X', basePrice: 50, capacity: 1 })
      .expect(403);
  });
});

describe('Public room search', () => {
  it('excludes rooms with overlapping non-cancelled bookings', async () => {
    const { user } = await createUser(UserRole.customer, 'guest@example.com');
    const { room, roomType } = await seedRoom(100, 2);

    await prisma.booking.create({
      data: {
        userId: user.id,
        roomId: room.id,
        checkIn: new Date('2026-06-01'),
        checkOut: new Date('2026-06-05'),
        status: BookingStatus.confirmed,
        totalPrice: 400,
        guestsCount: 1,
      },
    });

    const blocked = await request(app)
      .get('/api/rooms')
      .query({ checkIn: '2026-06-03', checkOut: '2026-06-07', guests: 1 })
      .expect(200);

    expect(blocked.body.rooms).toHaveLength(0);

    const free = await request(app)
      .get('/api/rooms')
      .query({
        checkIn: '2026-06-05',
        checkOut: '2026-06-08',
        guests: 1,
        type: roomType.id,
      })
      .expect(200);

    expect(free.body.rooms).toHaveLength(1);
    expect(free.body.rooms[0].id).toBe(room.id);
  });

  it('still shows room if overlapping booking is cancelled', async () => {
    const { user } = await createUser(UserRole.customer, 'guest2@example.com');
    const { room } = await seedRoom();

    await prisma.booking.create({
      data: {
        userId: user.id,
        roomId: room.id,
        checkIn: new Date('2026-07-01'),
        checkOut: new Date('2026-07-05'),
        status: BookingStatus.cancelled,
        totalPrice: 400,
        guestsCount: 1,
      },
    });

    const res = await request(app)
      .get('/api/rooms')
      .query({ checkIn: '2026-07-02', checkOut: '2026-07-04' })
      .expect(200);

    expect(res.body.rooms).toHaveLength(1);
  });
});

describe('Booking creation & customer endpoints', () => {
  it('creates a booking with totalPrice = basePrice × nights', async () => {
    const { token } = await createUser(UserRole.customer, 'booker@example.com');
    const { room } = await seedRoom(150, 2);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        roomId: room.id,
        checkIn: '2026-08-01',
        checkOut: '2026-08-04',
        guestsCount: 2,
      })
      .expect(201);

    expect(res.body.booking.totalPrice).toBe(450);
    expect(res.body.booking.status).toBe('pending');
    expect(res.body.booking.expiresAt).toBeTruthy();
  });

  it('rejects overlapping booking for the same room', async () => {
    const { token, user } = await createUser(UserRole.customer, 'overlap@example.com');
    const { room } = await seedRoom();

    await prisma.booking.create({
      data: {
        userId: user.id,
        roomId: room.id,
        checkIn: new Date('2026-09-01'),
        checkOut: new Date('2026-09-05'),
        status: BookingStatus.confirmed,
        totalPrice: 400,
        guestsCount: 1,
      },
    });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        roomId: room.id,
        checkIn: '2026-09-03',
        checkOut: '2026-09-06',
        guestsCount: 1,
      })
      .expect(409);

    expect(res.body.error).toMatch(/not available/i);
  });

  it('lists only the authenticated user bookings', async () => {
    const a = await createUser(UserRole.customer, 'a@example.com');
    const b = await createUser(UserRole.customer, 'b@example.com');
    const { room } = await seedRoom();

    await prisma.booking.create({
      data: {
        userId: a.user.id,
        roomId: room.id,
        checkIn: new Date('2026-10-01'),
        checkOut: new Date('2026-10-03'),
        status: BookingStatus.confirmed,
        totalPrice: 200,
        guestsCount: 1,
      },
    });

    const res = await request(app)
      .get('/api/bookings/me')
      .set('Authorization', `Bearer ${b.token}`)
      .expect(200);

    expect(res.body.bookings).toHaveLength(0);
  });

  it('cancels a pending/confirmed booking', async () => {
    const { token, user } = await createUser(UserRole.customer, 'cancel@example.com');
    const { room } = await seedRoom();

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        roomId: room.id,
        checkIn: new Date('2026-11-01'),
        checkOut: new Date('2026-11-03'),
        status: BookingStatus.confirmed,
        totalPrice: 200,
        guestsCount: 1,
      },
    });

    const res = await request(app)
      .patch(`/api/bookings/${booking.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.booking.status).toBe('cancelled');
  });

  it('blocks cancellation when checked_in', async () => {
    const { token, user } = await createUser(UserRole.customer, 'checkedin@example.com');
    const { room } = await seedRoom();

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        roomId: room.id,
        checkIn: new Date('2026-12-01'),
        checkOut: new Date('2026-12-03'),
        status: BookingStatus.checked_in,
        totalPrice: 200,
        guestsCount: 1,
      },
    });

    const res = await request(app)
      .patch(`/api/bookings/${booking.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .expect(409);

    expect(res.body.error).toMatch(/checked in or checked out/i);
  });
});

describe('Concurrent booking race', () => {
  it('allows only one of two simultaneous bookings for the same room/dates', async () => {
    const userA = await createUser(UserRole.customer, 'race-a@example.com');
    const userB = await createUser(UserRole.customer, 'race-b@example.com');
    const { room } = await seedRoom(100, 2);

    const payload = {
      roomId: room.id,
      checkIn: '2026-05-10',
      checkOut: '2026-05-14',
      guestsCount: 1,
    };

    const [resultA, resultB] = await Promise.allSettled([
      bookingService.createBooking(userA.user.id, payload),
      bookingService.createBooking(userB.user.id, payload),
    ]);

    const successes = [resultA, resultB].filter((r) => r.status === 'fulfilled');
    const failures = [resultA, resultB].filter((r) => r.status === 'rejected');

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    const count = await prisma.booking.count({
      where: {
        roomId: room.id,
        status: { not: BookingStatus.cancelled },
        checkIn: new Date('2026-05-10'),
        checkOut: new Date('2026-05-14'),
      },
    });
    expect(count).toBe(1);
  });
});
