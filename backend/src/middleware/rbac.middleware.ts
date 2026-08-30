import { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/database';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/helpers';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError(401, 'Authentication required'));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      next(new AppError(403, 'Account is deactivated'));
      return;
    }
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(401, 'Invalid or expired access token'));
  }
}

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError(403, 'Insufficient permissions'));
      return;
    }

    next();
  };
}
