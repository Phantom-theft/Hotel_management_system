import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as roomController from '../controllers/room.controller';
import { authenticate, authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { idParamSchema, roomCreateSchema, roomSearchSchema, roomUpdateSchema } from '../validation/schemas';

const router = Router();

// Public availability search
router.get('/', validate(roomSearchSchema), roomController.search);

// Admin CRUD
// Staff + admin need full inventory for desk board / walk-ins
router.get(
  '/admin/all',
  authenticate,
  authorize(UserRole.admin, UserRole.staff),
  roomController.listAdmin,
);
router.get('/:id', authenticate, authorize(UserRole.admin), validate(idParamSchema), roomController.getById);
router.post('/', authenticate, authorize(UserRole.admin), validate(roomCreateSchema), roomController.create);
router.patch('/:id', authenticate, authorize(UserRole.admin), validate(roomUpdateSchema), roomController.update);
router.delete('/:id', authenticate, authorize(UserRole.admin), validate(idParamSchema), roomController.remove);

export default router;
