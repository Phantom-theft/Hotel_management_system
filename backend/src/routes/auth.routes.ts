import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authRateLimit } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import { authLoginSchema, authRegisterSchema, emptyBodySchema } from '../validation/schemas';

const router = Router();

router.post('/register', authRateLimit, validate(authRegisterSchema), authController.register);
router.post('/login', authRateLimit, validate(authLoginSchema), authController.login);
router.post('/refresh', validate(emptyBodySchema), authController.refresh);
router.post('/logout', validate(emptyBodySchema), authController.logout);

export default router;
