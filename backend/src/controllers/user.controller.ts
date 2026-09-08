import { NextFunction, Request, Response } from 'express';
import { uploadAvatarFile } from '../services/cloudinary.service';
import * as userService from '../services/user.service';
import { AppError } from '../utils/helpers';

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError(401, 'Authentication required');
    }
    const user = await userService.getCurrentUser(req.user.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError(401, 'Authentication required');
    }
    const user = await userService.updateCurrentUser(req.user.id, {
      name: req.body.name,
      phone: req.body.phone,
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError(401, 'Authentication required');
    }
    const file = req.file;
    if (!file) {
      throw new AppError(400, 'Please choose an image file to upload');
    }
    const avatarUrl = await uploadAvatarFile(file);
    const user = await userService.updateCurrentUser(req.user.id, { avatarUrl });
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function removeAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError(401, 'Authentication required');
    }
    const user = await userService.updateCurrentUser(req.user.id, { avatarUrl: null });
    res.json({ user });
  } catch (error) {
    next(error);
  }
}
