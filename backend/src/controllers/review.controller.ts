import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/helpers';
import * as reviewService from '../services/review.service';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const review = await reviewService.createReview(req.user.id, req.body);
    res.status(201).json({ review });
  } catch (error) {
    next(error);
  }
}

export async function listByRoomType(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const data = await reviewService.listRoomTypeReviews(req.params.id as string, page, limit);
    res.json(data);
  } catch (error) {
    next(error);
  }
}
