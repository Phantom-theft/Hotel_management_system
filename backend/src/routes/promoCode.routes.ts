import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as promoCodeController from '../controllers/promoCode.controller';
import { authenticate, authorize } from '../middleware/rbac.middleware';
import { promoValidateRateLimit } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  idParamSchema,
  promoCreateSchema,
  promoUpdateSchema,
  promoValidateSchema,
} from '../validation/schemas';

const router = Router();

// Public — live discount preview (read-only; rate-limited to curb enumeration)
router.get(
  '/validate',
  promoValidateRateLimit,
  validate(promoValidateSchema),
  promoCodeController.validate,
);

router.use(authenticate, authorize(UserRole.admin));
router.get('/', promoCodeController.list);
router.post('/', validate(promoCreateSchema), promoCodeController.create);
router.patch('/:id', validate(promoUpdateSchema), promoCodeController.update);
router.delete('/:id', validate(idParamSchema), promoCodeController.remove);

export default router;
