import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as reportController from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate, authorize(UserRole.admin));

router.get('/occupancy', reportController.occupancy);
router.get('/revenue', reportController.revenue);
router.get('/cancellations', reportController.cancellations);

export default router;
