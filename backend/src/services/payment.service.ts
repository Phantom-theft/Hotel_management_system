import Stripe from 'stripe';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { env } from '../config/env';
import { stripe } from '../config/stripe';
import { prisma } from '../config/database';
import { AppError } from '../utils/helpers';
import { decimalToNumber } from '../utils/booking';
import { sendBookingConfirmationEmail } from './email.service';

export async function createPaymentIntent(userId: string, bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { room: true },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }
  if (booking.userId !== userId) {
    throw new AppError(403, 'You can only pay for your own bookings');
  }
  if (booking.status !== BookingStatus.pending) {
    throw new AppError(409, 'Payment can only be started for pending bookings');
  }
  if (booking.expiresAt && booking.expiresAt <= new Date()) {
    throw new AppError(409, 'Booking payment window has expired');
  }

  const amountCents = Math.round(decimalToNumber(booking.totalPrice) * 100);
  if (amountCents < 50) {
    throw new AppError(400, 'Booking amount is too low for Stripe');
  }

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: env.stripe.currency,
    metadata: { bookingId: booking.id, userId },
    automatic_payment_methods: { enabled: true },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amount: booking.totalPrice,
      status: PaymentStatus.pending,
      stripePaymentId: intent.id,
    },
  });

  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
    amount: decimalToNumber(booking.totalPrice),
    currency: env.stripe.currency,
  };
}

export function constructStripeEvent(rawBody: Buffer | string, signature: string): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(rawBody, signature, env.stripe.webhookSecret);
  } catch {
    throw new AppError(400, 'Invalid Stripe webhook signature');
  }
}

/**
 * payment_intent.succeeded → Payment paid, Booking confirmed (clears expiresAt).
 * payment_intent.payment_failed → cancel the pending booking so the room is freed
 * immediately (guest can create a new booking). Keeping pending until TTL would also
 * work, but failed payment usually means the guest abandoned checkout.
 */
export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await onPaymentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await onPaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    default:
      break;
  }
}

async function onPaymentSucceeded(intent: Stripe.PaymentIntent): Promise<void> {
  const bookingId = intent.metadata?.bookingId;
  if (!bookingId) {
    console.error('payment_intent.succeeded missing bookingId metadata', intent.id);
    return;
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { room: true, user: true },
  });
  if (!booking) {
    return;
  }

  if (booking.status === BookingStatus.confirmed) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: { stripePaymentId: intent.id },
      data: { status: PaymentStatus.paid },
    });

    // Ensure a payment row exists even if create-intent was retried oddly
    const existing = await tx.payment.findFirst({ where: { stripePaymentId: intent.id } });
    if (!existing) {
      await tx.payment.create({
        data: {
          bookingId,
          amount: booking.totalPrice,
          status: PaymentStatus.paid,
          stripePaymentId: intent.id,
        },
      });
    }

    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.confirmed,
        expiresAt: null,
      },
    });
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
    console.error('Failed to send confirmation email', err);
  }
}

async function onPaymentFailed(intent: Stripe.PaymentIntent): Promise<void> {
  const bookingId = intent.metadata?.bookingId;
  if (!bookingId) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: { stripePaymentId: intent.id },
      data: { status: PaymentStatus.pending },
    });

    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (booking?.status === BookingStatus.pending) {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.cancelled, expiresAt: null },
      });
    }
  });
}
