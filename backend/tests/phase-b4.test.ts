import request from 'supertest';
import { BookingStatus, UserRole } from '@prisma/client';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import { hashPassword } from '../src/utils/password';
import { signAccessToken } from '../src/utils/jwt';

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
    data: { name: 'ReviewType', basePrice, capacity, amenities: [], images: [] },
  });
  const room = await prisma.room.create({
    data: { roomTypeId: roomType.id, roomNumber: `${Math.floor(Math.random() * 9000) + 1000}`, floor: 1 },
  });
  return { roomType, room };
}

describe('Review eligibility', () => {
  it('allows review only with checked_out booking for same room type', async () => {
    const { user, token } = await createUser(UserRole.customer, 'review-ok@example.com');
    const { roomType, room } = await seedRoom();

    await prisma.booking.create({
      data: {
        userId: user.id,
        roomId: room.id,
        checkIn: new Date('2026-01-01'),
        checkOut: new Date('2026-01-03'),
        status: BookingStatus.checked_out,
        totalPrice: 200,
        guestsCount: 1,
      },
    });

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomTypeId: roomType.id, rating: 5, comment: 'Great' })
      .expect(201);

    expect(res.body.review.rating).toBe(5);

    const list = await request(app)
      .get(`/api/roomtypes/${roomType.id}/reviews?page=1&limit=10`)
      .expect(200);
    expect(list.body).toHaveProperty('averageRating');
    expect(list.body.reviews.length).toBeGreaterThan(0);
  });

  it('rejects review when no checked_out booking exists', async () => {
    const { token } = await createUser(UserRole.customer, 'review-no@example.com');
    const { roomType } = await seedRoom();

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomTypeId: roomType.id, rating: 4, comment: 'Test' })
      .expect(403);

    expect(res.body.error).toMatch(/checked-out stay/i);
  });
});

describe('Promo code application', () => {
  it('applies active promo and increments usedCount', async () => {
    const { user, token } = await createUser(UserRole.customer, 'promo-ok@example.com');
    const { room } = await seedRoom(100, 2);

    await prisma.promoCode.create({
      data: {
        code: 'TEST10',
        discountPercent: 10,
        validFrom: new Date('2020-01-01'),
        validTo: new Date('2099-01-01'),
        maxUses: 2,
        usedCount: 0,
      },
    });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        roomId: room.id,
        checkIn: '2026-02-01',
        checkOut: '2026-02-04',
        guestsCount: 1,
        promoCode: 'TEST10',
      })
      .expect(201);

    expect(res.body.booking.totalPrice).toBe(270);
    expect(res.body.booking.status).toBe('pending');

    const promo = await prisma.promoCode.findUniqueOrThrow({ where: { code: 'TEST10' } });
    expect(promo.usedCount).toBe(1);

    await prisma.booking.update({
      where: { id: res.body.booking.id },
      data: { status: BookingStatus.cancelled, expiresAt: null },
    });
    await prisma.booking.create({
      data: {
        userId: user.id,
        roomId: room.id,
        checkIn: new Date('2026-02-10'),
        checkOut: new Date('2026-02-11'),
        status: BookingStatus.checked_out,
        totalPrice: 100,
        guestsCount: 1,
      },
    });
  });

  it('rejects expired or maxed promo code', async () => {
    const { token } = await createUser(UserRole.customer, 'promo-bad@example.com');
    const { room } = await seedRoom();

    await prisma.promoCode.create({
      data: {
        code: 'OLD50',
        discountPercent: 50,
        validFrom: new Date('2020-01-01'),
        validTo: new Date('2020-02-01'),
        maxUses: 1,
        usedCount: 1,
      },
    });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        roomId: room.id,
        checkIn: '2026-03-01',
        checkOut: '2026-03-03',
        guestsCount: 1,
        promoCode: 'OLD50',
      })
      .expect(409);

    expect(res.body.error).toMatch(/promo code/i);
  });
});

describe('RBAC matrix (all protected route groups)', () => {
  it('enforces role restrictions consistently', async () => {
    const admin = await createUser(UserRole.admin, 'matrix-admin@example.com');
    const staff = await createUser(UserRole.staff, 'matrix-staff@example.com');
    const customer = await createUser(UserRole.customer, 'matrix-customer@example.com');
    const { roomType, room } = await seedRoom();

    const guestForWalkIn = {
      roomId: room.id,
      checkIn: '2026-10-01',
      checkOut: '2026-10-03',
      guestsCount: 1,
      guestName: 'Walk In',
      guestEmail: 'walk-in-matrix@example.com',
    };

    const checks: Array<{
      method: 'get' | 'post' | 'patch' | 'delete';
      path: string;
      body?: Record<string, unknown>;
      allowed: UserRole[];
    }> = [
      { method: 'post', path: '/api/room-types', body: { name: 'X', basePrice: 1, capacity: 1 }, allowed: [UserRole.admin] },
      { method: 'post', path: '/api/rooms', body: { roomTypeId: roomType.id, roomNumber: '9999', floor: 1 }, allowed: [UserRole.admin] },
      { method: 'post', path: '/api/promo-codes', body: { code: 'RBAC10', discountPercent: 10, validFrom: '2026-01-01T00:00:00.000Z', validTo: '2027-01-01T00:00:00.000Z', maxUses: 10 }, allowed: [UserRole.admin] },
      { method: 'post', path: '/api/staff/invite', body: { name: 'S', email: 's@x.com', role: 'staff' }, allowed: [UserRole.admin] },
      { method: 'get', path: '/api/reports/occupancy?from=2026-01-01&to=2026-01-03', allowed: [UserRole.admin] },
      { method: 'get', path: '/api/bookings/today', allowed: [UserRole.staff, UserRole.admin] },
      { method: 'post', path: '/api/bookings/walk-in', body: guestForWalkIn, allowed: [UserRole.staff, UserRole.admin] },
    ];

    for (const c of checks) {
      const call = (token?: string) => {
        let req = request(app)[c.method](c.path);
        if (token) req = req.set('Authorization', `Bearer ${token}`);
        if (c.body) req = req.send(c.body);
        return req;
      };

      await call().expect(401);

      const roleTokens: Record<UserRole, string> = {
        admin: admin.token,
        staff: staff.token,
        customer: customer.token,
      };

      for (const role of [UserRole.customer, UserRole.staff, UserRole.admin]) {
        const res = await call(roleTokens[role]);
        if (c.allowed.includes(role)) {
          expect(res.status).not.toBe(403);
        } else {
          expect(res.status).toBe(403);
        }
      }
    }
  });
});

describe('Promo code validate (public preview)', () => {
  it('returns only minimal fields for a valid code', async () => {
    await prisma.promoCode.create({
      data: {
        code: 'PREVIEW10',
        discountPercent: 10,
        validFrom: new Date('2020-01-01'),
        validTo: new Date('2030-01-01'),
        maxUses: 100,
        usedCount: 3,
      },
    });

    const res = await request(app)
      .get('/api/promo-codes/validate')
      .query({ code: 'PREVIEW10' })
      .expect(200);

    expect(res.body).toEqual({ valid: true, discountPercent: 10 });
    expect(res.body).not.toHaveProperty('usedCount');
    expect(res.body).not.toHaveProperty('maxUses');
    expect(res.body).not.toHaveProperty('remainingUses');
    expect(res.body).not.toHaveProperty('validFrom');
    expect(res.body).not.toHaveProperty('validTo');
    expect(res.body).not.toHaveProperty('code');
    expect(res.body).not.toHaveProperty('promo');
  });

  it('returns 200 { valid: false } for unknown, expired, and exhausted codes', async () => {
    await prisma.promoCode.create({
      data: {
        code: 'EXPIRED',
        discountPercent: 15,
        validFrom: new Date('2020-01-01'),
        validTo: new Date('2021-01-01'),
        maxUses: 10,
        usedCount: 0,
      },
    });
    await prisma.promoCode.create({
      data: {
        code: 'USEDUP',
        discountPercent: 20,
        validFrom: new Date('2020-01-01'),
        validTo: new Date('2030-01-01'),
        maxUses: 1,
        usedCount: 1,
      },
    });

    const unknown = await request(app)
      .get('/api/promo-codes/validate')
      .query({ code: 'NOPE123' })
      .expect(200);
    expect(unknown.body).toEqual({ valid: false });

    const expired = await request(app)
      .get('/api/promo-codes/validate')
      .query({ code: 'EXPIRED' })
      .expect(200);
    expect(expired.body).toEqual({ valid: false });

    const usedUp = await request(app)
      .get('/api/promo-codes/validate')
      .query({ code: 'USEDUP' })
      .expect(200);
    expect(usedUp.body).toEqual({ valid: false });
  });

  it('returns 429 after exceeding 20 requests per minute', async () => {
    // Distinct path/IP bucket from other tests in this describe — still shares the same limiter.
    // Fire 21 requests; the 21st must be rate-limited.
    let limitedStatus: number | null = null;
    for (let i = 0; i < 21; i++) {
      const res = await request(app)
        .get('/api/promo-codes/validate')
        .query({ code: `RATE${i}` });
      if (res.status === 429) {
        limitedStatus = res.status;
        expect(res.body).toHaveProperty('error');
        break;
      }
      expect(res.status).toBe(200);
    }
    expect(limitedStatus).toBe(429);
  });
});
