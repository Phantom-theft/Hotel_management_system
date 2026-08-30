import dotenv from 'dotenv';
import { prisma } from '../src/config/database';

dotenv.config({ path: '.env' });

jest.mock('../src/services/email.service', () => ({
  sendBookingConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  sendBookingCancellationEmail: jest.fn().mockResolvedValue(undefined),
  sendStaffInviteEmail: jest.fn().mockResolvedValue(undefined),
}));

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.room.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.user.deleteMany();
});
