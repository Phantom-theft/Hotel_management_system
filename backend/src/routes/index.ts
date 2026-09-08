import { Router, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import authRoutes from './auth.routes';
import roomTypeRoutes from './roomType.routes';
import roomRoutes from './room.routes';
import bookingRoutes from './booking.routes';
import paymentRoutes from './payment.routes';
import reportRoutes from './report.routes';
import staffRoutes from './staff.routes';
import promoCodeRoutes from './promoCode.routes';
import reviewRoutes from './review.routes';
import userRoutes from './user.routes';
import { authenticate, authorize } from '../middleware/rbac.middleware';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/room-types', roomTypeRoutes);
router.use('/rooms', roomRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/reports', reportRoutes);
router.use('/staff', staffRoutes);
router.use('/promo-codes', promoCodeRoutes);
router.use('/', reviewRoutes);

router.get(
  '/admin/dashboard',
  authenticate,
  authorize(UserRole.admin),
  (_req: Request, res: Response) => {
    res.json({ message: 'Admin dashboard' });
  },
);

export default router;
