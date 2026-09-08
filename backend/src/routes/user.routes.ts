import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/rbac.middleware';
import { handleUploadError, uploadAvatarImage } from '../middleware/upload.middleware';
import { validate } from '../middleware/validate.middleware';
import { updateMeSchema } from '../validation/schemas';

const router = Router();

router.get('/me', authenticate, userController.getMe);
router.patch('/me', authenticate, validate(updateMeSchema), userController.updateMe);

router.post(
  '/me/avatar',
  authenticate,
  (req, res, next) => {
    uploadAvatarImage(req, res, (err) => {
      if (err) {
        handleUploadError(err, req, res, next);
        return;
      }
      next();
    });
  },
  userController.uploadAvatar,
);

router.delete('/me/avatar', authenticate, userController.removeAvatar);

export default router;
