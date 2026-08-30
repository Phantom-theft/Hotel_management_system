import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as staffController from '../controllers/staff.controller';
import { authenticate, authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { idParamSchema, staffAssignRoleSchema, staffInviteSchema } from '../validation/schemas';

const router = Router();

router.use(authenticate, authorize(UserRole.admin));

router.get('/', staffController.list);
router.post('/invite', validate(staffInviteSchema), staffController.invite);
router.patch('/:id/role', validate(staffAssignRoleSchema), staffController.assignRole);
router.patch('/:id/deactivate', validate(idParamSchema), staffController.deactivate);
router.patch('/:id/reactivate', validate(idParamSchema), staffController.reactivate);

export default router;
