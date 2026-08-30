import { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import * as staffService from '../services/staff.service';
import { AppError } from '../utils/helpers';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const staff = await staffService.listStaff();
    res.json({ staff });
  } catch (error) {
    next(error);
  }
}

export async function invite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }
    const result = await staffService.inviteStaff(req.user.id, {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role as UserRole,
      phone: req.body.phone,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function assignRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }
    const user = await staffService.assignStaffRole(
      req.user.id,
      req.params.id as string,
      req.body.role as UserRole,
    );
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }
    const user = await staffService.deactivateStaff(req.user.id, req.params.id as string);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function reactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }
    const user = await staffService.reactivateStaff(req.user.id, req.params.id as string);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}
