import { NextFunction, Request, Response } from 'express';
import * as paymentService from '../services/payment.service';
import { AppError } from '../utils/helpers';

export async function createIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }
    const { bookingId } = req.body;
    if (!bookingId) {
      throw new AppError(400, 'bookingId is required');
    }
    const result = await paymentService.createPaymentIntent(req.user.id, bookingId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      throw new AppError(400, 'Missing Stripe-Signature header');
    }

    const rawBody = req.body;
    if (!Buffer.isBuffer(rawBody)) {
      throw new AppError(400, 'Webhook requires raw body');
    }

    const event = paymentService.constructStripeEvent(rawBody, signature);
    await paymentService.handleStripeWebhookEvent(event);
    res.json({ received: true });
  } catch (error) {
    next(error);
  }
}
