import Stripe from 'stripe';
import { env } from './env';

export const stripe = new Stripe(env.stripe.secretKey, {
  apiVersion: '2026-07-29.dahlia',
});
