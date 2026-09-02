import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as bookingController from '../controllers/booking.controller';
import { authenticate, authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { bookingCreateSchema, bookingWalkInSchema, idParamSchema } from '../validation/schemas';

const router = Router();

router.post('/', authenticate, validate(bookingCreateSchema), bookingController.create);
router.get('/me', authenticate, bookingController.listMine);
router.patch('/:id/cancel', authenticate, validate(idParamSchema), bookingController.cancel);

// Staff / admin operations
router.get(
  '/admin/all',
  authenticate,
  authorize(UserRole.admin),
  bookingController.listAll,
);
router.get(
  '/today',
  authenticate,
  authorize(UserRole.staff, UserRole.admin),
  bookingController.today,
);
router.post(
  '/walk-in',
  authenticate,
  authorize(UserRole.staff, UserRole.admin),
  validate(bookingWalkInSchema),
  bookingController.walkIn,
);
router.patch(
  '/:id/check-in',
  authenticate,
  authorize(UserRole.staff, UserRole.admin),
  validate(idParamSchema),
  bookingController.checkIn,
);
router.patch(
  '/:id/check-out',
  authenticate,
  authorize(UserRole.staff, UserRole.admin),
  validate(idParamSchema),
  bookingController.checkOut,
);
router.patch(
  '/:id/staff-cancel',
  authenticate,
  authorize(UserRole.staff, UserRole.admin),
  validate(idParamSchema),
  bookingController.staffCancel,
);

export default router;
