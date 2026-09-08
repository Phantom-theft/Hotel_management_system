import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/rbac.middleware';
import { authRateLimit } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  authLoginSchema,
  authRegisterSchema,
  changePasswordSchema,
  emptyBodySchema,
} from '../validation/schemas';

const router = Router();

router.post('/register', authRateLimit, validate(authRegisterSchema), authController.register);
router.post('/login', authRateLimit, validate(authLoginSchema), authController.login);
router.post('/refresh', validate(emptyBodySchema), authController.refresh);
router.post('/logout', validate(emptyBodySchema), authController.logout);
router.patch(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);

export default router;
