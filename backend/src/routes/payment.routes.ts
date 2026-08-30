import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { paymentIntentSchema } from '../validation/schemas';

const router = Router();

router.post('/create-intent', authenticate, validate(paymentIntentSchema), paymentController.createIntent);
// Webhook is mounted in app.ts with raw body parser

export default router;
