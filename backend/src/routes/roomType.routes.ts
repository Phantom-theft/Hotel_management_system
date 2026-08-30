import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as roomTypeController from '../controllers/roomType.controller';
import { authenticate, authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { idParamSchema, roomTypeCreateSchema, roomTypeUpdateSchema } from '../validation/schemas';

const router = Router();

router.get('/', authenticate, authorize(UserRole.admin), roomTypeController.list);
router.get('/:id', authenticate, authorize(UserRole.admin), validate(idParamSchema), roomTypeController.getById);
router.post('/', authenticate, authorize(UserRole.admin), validate(roomTypeCreateSchema), roomTypeController.create);
router.patch('/:id', authenticate, authorize(UserRole.admin), validate(roomTypeUpdateSchema), roomTypeController.update);
router.delete('/:id', authenticate, authorize(UserRole.admin), validate(idParamSchema), roomTypeController.remove);

export default router;
