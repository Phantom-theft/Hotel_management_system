import request from 'supertest';
import Stripe from 'stripe';
import { BookingStatus, PaymentStatus, UserRole } from '@prisma/client';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import { env } from '../src/config/env';
import { hashPassword } from '../src/utils/password';
import { signAccessToken } from '../src/utils/jwt';
import * as paymentService from '../src/services/payment.service';
import { blockingOverlapWhere } from '../src/utils/availability';

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

async function seedRoom() {
  const roomType = await prisma.roomType.create({
    data: { name: 'Standard', basePrice: 100, capacity: 2, amenities: [], images: [] },
  });
  const room = await prisma.room.create({
    data: { roomTypeId: roomType.id, roomNumber: '201', floor: 2, status: 'available' },
  });
  return { roomType, room };
}

describe('Pending booking expiry / overlap', () => {
  it('unexpired pending booking blocks the room', async () => {
    const { user } = await createUser(UserRole.customer, 'hold@example.com');
    const { room } = await seedRoom();

    await prisma.booking.create({
      data: {
        userId: user.id,
        roomId: room.id,
        checkIn: new Date('2026-06-01'),
        checkOut: new Date('2026-06-05'),
        status: BookingStatus.pending,
        totalPrice: 400,
        guestsCount: 1,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    const other = await createUser(UserRole.customer, 'other-hold@example.com');
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${other.token}`)
      .send({
        roomId: room.id,
        checkIn: '2026-06-02',
        checkOut: '2026-06-04',
        guestsCount: 1,
      })
      .expect(409);

    expect(res.body.error).toMatch(/not available/i);
  });

  it('expired pending booking does not block the room', async () => {
    const { user } = await createUser(UserRole.customer, 'expired@example.com');
    const { room } = await seedRoom();

    await prisma.booking.create({
      data: {
        userId: user.id,
        roomId: room.id,
        checkIn: new Date('2026-06-01'),
        checkOut: new Date('2026-06-05'),
        status: BookingStatus.pending,
        totalPrice: 400,
        guestsCount: 1,
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const other = await createUser(UserRole.customer, 'other-expired@example.com');
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${other.token}`)
      .send({
        roomId: room.id,
        checkIn: '2026-06-02',
        checkOut: '2026-06-04',
        guestsCount: 1,
      })
      .expect(201);

    expect(res.body.booking.status).toBe('pending');

    const search = await request(app)
      .get('/api/rooms')
      .query({ checkIn: '2026-06-02', checkOut: '2026-06-04' })
      .expect(200);

    // New pending hold blocks; original expired one does not add a second conflict
    expect(search.body.rooms).toHaveLength(0);
  });

  it('blockingOverlapWhere treats expired pending as non-blocking', () => {
    const where = blockingOverlapWhere(new Date('2026-01-01'), new Date('2026-01-05'));
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: { not: BookingStatus.pending } }),
        expect.objectContaining({ expiresAt: null }),
      ]),
    );
  });
});

describe('Stripe webhook', () => {
  it('rejects invalid signatures', async () => {
    await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', 'invalid')
      .send(Buffer.from('{}'))
      .expect(400);
  });

  it('verifies a valid webhook signature', async () => {
    const { user } = await createUser(UserRole.customer, 'pay@example.com');
    const { room } = await seedRoom();

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        roomId: room.id,
        checkIn: new Date('2026-07-01'),
        checkOut: new Date('2026-07-03'),
        status: BookingStatus.pending,
        totalPrice: 200,
        guestsCount: 1,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: 200,
        status: PaymentStatus.pending,
        stripePaymentId: 'pi_test_success',
      },
    });

    const payload = JSON.stringify({
      id: 'evt_test_1',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_success',
          object: 'payment_intent',
          metadata: { bookingId: booking.id, userId: user.id },
        },
      },
    });

    const header = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: env.stripe.webhookSecret,
    });

    const event = paymentService.constructStripeEvent(Buffer.from(payload), header);
    expect(event.type).toBe('payment_intent.succeeded');
  });

  it('handleStripeWebhookEvent confirms pending → confirmed', async () => {
    const { user } = await createUser(UserRole.customer, 'direct-wh@example.com');
    const { room } = await seedRoom();
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        roomId: room.id,
        checkIn: new Date('2026-08-01'),
        checkOut: new Date('2026-08-02'),
        status: BookingStatus.pending,
        totalPrice: 100,
        guestsCount: 1,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: 100,
        status: PaymentStatus.pending,
        stripePaymentId: 'pi_direct',
      },
    });

    await paymentService.handleStripeWebhookEvent({
      id: 'evt_2',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_direct',
          object: 'payment_intent',
          metadata: { bookingId: booking.id },
        },
      },
    } as unknown as Stripe.Event);

    const updated = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(updated.status).toBe(BookingStatus.confirmed);
  });
});

describe('Staff / admin RBAC', () => {
  it('blocks customers from staff today endpoint', async () => {
    const { token } = await createUser(UserRole.customer, 'cust-staff@example.com');
    await request(app)
      .get('/api/bookings/today')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('allows staff to access today endpoint', async () => {
    const { token } = await createUser(UserRole.staff, 'staff-today@example.com');
    const res = await request(app)
      .get('/api/bookings/today')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toHaveProperty('checkIns');
    expect(res.body).toHaveProperty('checkOuts');
  });

  it('blocks staff from admin reports', async () => {
    const { token } = await createUser(UserRole.staff, 'staff-report@example.com');
    await request(app)
      .get('/api/reports/occupancy')
      .query({ from: '2026-01-01', to: '2026-01-07' })
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('allows admin reports and staff invite', async () => {
    const { token } = await createUser(UserRole.admin, 'admin-b3@example.com');

    const occ = await request(app)
      .get('/api/reports/occupancy')
      .query({ from: '2026-01-01', to: '2026-01-03' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(occ.body).toHaveProperty('overallOccupancyRate');

    const invite = await request(app)
      .post('/api/staff/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Staff', email: 'newstaff@example.com', role: 'staff' })
      .expect(201);

    expect(invite.body.user.role).toBe('staff');
    expect(invite.body.tempPassword).toBeTruthy();

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'staff.invited', targetId: invite.body.user.id },
    });
    expect(audit).toBeTruthy();
  });

  it('admin can reactivate a deactivated staff account; non-admin gets 403', async () => {
    const { token: adminToken } = await createUser(UserRole.admin, 'admin-reactivate@example.com');
    const { user: staffUser } = await createUser(UserRole.staff, 'reactivate-staff@example.com');
    const { token: staffToken } = await createUser(UserRole.staff, 'staff-no-reactivate@example.com');
    const { token: customerToken } = await createUser(
      UserRole.customer,
      'cust-no-reactivate@example.com',
    );

    await request(app)
      .patch(`/api/staff/${staffUser.id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const blocked = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reactivate-staff@example.com', password: 'password123' })
      .expect(403);
    expect(blocked.body.error).toMatch(/deactivated/i);

    await request(app)
      .patch(`/api/staff/${staffUser.id}/reactivate`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(403);

    await request(app)
      .patch(`/api/staff/${staffUser.id}/reactivate`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    const reactivated = await request(app)
      .patch(`/api/staff/${staffUser.id}/reactivate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(reactivated.body.user.isActive).toBe(true);

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'staff.reactivated', targetId: staffUser.id },
    });
    expect(audit).toBeTruthy();

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reactivate-staff@example.com', password: 'password123' })
      .expect(200);
    expect(login.body.accessToken).toBeTruthy();
  });

  it('walk-in creates confirmed booking immediately', async () => {
    const { token } = await createUser(UserRole.staff, 'walkin-staff@example.com');
    const { room } = await seedRoom();

    const res = await request(app)
      .post('/api/bookings/walk-in')
      .set('Authorization', `Bearer ${token}`)
      .send({
        roomId: room.id,
        checkIn: '2026-09-01',
        checkOut: '2026-09-03',
        guestsCount: 1,
        guestName: 'Walk In Guest',
        guestEmail: 'walkin@example.com',
      })
      .expect(201);

    expect(res.body.booking.status).toBe('confirmed');
    expect(res.body.booking.expiresAt).toBeNull();

    const payment = await prisma.payment.findFirst({
      where: { bookingId: res.body.booking.id, status: PaymentStatus.paid },
    });
    expect(payment).toBeTruthy();
  });
});
