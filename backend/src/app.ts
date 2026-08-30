import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import routes from './routes';
import * as paymentController from './controllers/payment.controller';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );

  // Stripe webhook needs the raw body for signature verification
  app.post(
    '/api/payments/webhook',
    express.raw({ type: 'application/json' }),
    paymentController.webhook,
  );

  app.use(express.json());
  app.use(cookieParser());

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
