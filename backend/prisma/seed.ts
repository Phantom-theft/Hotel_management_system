import { BookingStatus, PaymentStatus, PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 12);
}

function daysFromNow(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function main() {
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.room.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  const [customer, staff, admin] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Demo Customer',
        email: 'customer@demo.hotel',
        passwordHash: await hash('Customer123!'),
        role: UserRole.customer,
        phone: '+10000000001',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Demo Staff',
        email: 'staff@demo.hotel',
        passwordHash: await hash('Staff123!'),
        role: UserRole.staff,
        phone: '+10000000002',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Demo Admin',
        email: 'admin@demo.hotel',
        passwordHash: await hash('Admin123!'),
        role: UserRole.admin,
        phone: '+10000000003',
      },
    }),
  ]);

  const roomTypes = await Promise.all([
    prisma.roomType.create({
      data: {
        name: 'Standard Queen',
        basePrice: 120,
        capacity: 2,
        amenities: ['WiFi', 'AC', 'TV'],
        images: [],
        description: 'Comfortable room for couples or solo travelers.',
      },
    }),
    prisma.roomType.create({
      data: {
        name: 'Family Suite',
        basePrice: 220,
        capacity: 4,
        amenities: ['WiFi', 'AC', 'TV', 'Mini Fridge'],
        images: [],
        description: 'Spacious suite ideal for families.',
      },
    }),
    prisma.roomType.create({
      data: {
        name: 'Executive King',
        basePrice: 300,
        capacity: 2,
        amenities: ['WiFi', 'AC', 'TV', 'Work Desk', 'Coffee Machine'],
        images: [],
        description: 'Premium room for business travelers.',
      },
    }),
  ]);

  const rooms = await Promise.all([
    prisma.room.create({ data: { roomTypeId: roomTypes[0].id, roomNumber: '101', floor: 1 } }),
    prisma.room.create({ data: { roomTypeId: roomTypes[0].id, roomNumber: '102', floor: 1 } }),
    prisma.room.create({ data: { roomTypeId: roomTypes[1].id, roomNumber: '201', floor: 2 } }),
    prisma.room.create({ data: { roomTypeId: roomTypes[1].id, roomNumber: '202', floor: 2 } }),
    prisma.room.create({ data: { roomTypeId: roomTypes[2].id, roomNumber: '301', floor: 3 } }),
  ]);

  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        userId: customer.id,
        roomId: rooms[0].id,
        checkIn: daysFromNow(-10),
        checkOut: daysFromNow(-7),
        status: BookingStatus.checked_out,
        totalPrice: 360,
        guestsCount: 2,
      },
    }),
    prisma.booking.create({
      data: {
        userId: customer.id,
        roomId: rooms[1].id,
        checkIn: daysFromNow(-2),
        checkOut: daysFromNow(1),
        status: BookingStatus.checked_in,
        totalPrice: 360,
        guestsCount: 1,
      },
    }),
    prisma.booking.create({
      data: {
        userId: customer.id,
        roomId: rooms[2].id,
        checkIn: daysFromNow(3),
        checkOut: daysFromNow(6),
        status: BookingStatus.confirmed,
        totalPrice: 660,
        guestsCount: 3,
      },
    }),
    prisma.booking.create({
      data: {
        userId: customer.id,
        roomId: rooms[3].id,
        checkIn: daysFromNow(8),
        checkOut: daysFromNow(10),
        status: BookingStatus.pending,
        expiresAt: daysFromNow(0),
        totalPrice: 440,
        guestsCount: 2,
      },
    }),
    prisma.booking.create({
      data: {
        userId: customer.id,
        roomId: rooms[4].id,
        checkIn: daysFromNow(12),
        checkOut: daysFromNow(14),
        status: BookingStatus.cancelled,
        totalPrice: 600,
        guestsCount: 1,
      },
    }),
  ]);

  await Promise.all([
    prisma.payment.create({
      data: { bookingId: bookings[0].id, amount: 360, status: PaymentStatus.paid, stripePaymentId: 'seed_pi_1' },
    }),
    prisma.payment.create({
      data: { bookingId: bookings[2].id, amount: 660, status: PaymentStatus.paid, stripePaymentId: 'seed_pi_2' },
    }),
    prisma.payment.create({
      data: { bookingId: bookings[3].id, amount: 440, status: PaymentStatus.pending, stripePaymentId: 'seed_pi_3' },
    }),
  ]);

  await Promise.all([
    prisma.review.create({
      data: { userId: customer.id, roomTypeId: roomTypes[0].id, rating: 5, comment: 'Excellent stay' },
    }),
    prisma.review.create({
      data: { userId: customer.id, roomTypeId: roomTypes[0].id, rating: 4, comment: 'Very good value' },
    }),
    prisma.review.create({
      data: { userId: customer.id, roomTypeId: roomTypes[1].id, rating: 4, comment: 'Great for family trips' },
    }),
  ]);

  await Promise.all([
    prisma.promoCode.create({
      data: {
        code: 'WELCOME10',
        discountPercent: 10,
        validFrom: daysFromNow(-30),
        validTo: daysFromNow(30),
        maxUses: 500,
        usedCount: 12,
      },
    }),
    prisma.promoCode.create({
      data: {
        code: 'SUMMER15',
        discountPercent: 15,
        validFrom: daysFromNow(-7),
        validTo: daysFromNow(20),
        maxUses: 200,
        usedCount: 45,
      },
    }),
    prisma.promoCode.create({
      data: {
        code: 'VIP20',
        discountPercent: 20,
        validFrom: daysFromNow(-1),
        validTo: daysFromNow(10),
        maxUses: 50,
        usedCount: 5,
      },
    }),
  ]);

  console.log('Seed complete.');
  console.log('Demo users:');
  console.log('customer@demo.hotel / Customer123!');
  console.log('staff@demo.hotel / Staff123!');
  console.log('admin@demo.hotel / Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
