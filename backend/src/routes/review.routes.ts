import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { authenticate } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { idParamSchema, paginationSchema, reviewCreateSchema } from '../validation/schemas';

const router = Router();

router.post('/reviews', authenticate, validate(reviewCreateSchema), reviewController.create);
router.get(
  '/roomtypes/:id/reviews',
  validate(idParamSchema.merge(paginationSchema)),
  reviewController.listByRoomType,
);

export default router;
