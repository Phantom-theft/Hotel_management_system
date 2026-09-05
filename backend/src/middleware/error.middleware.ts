import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/helpers';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // express.json / raw body parser size limit
  if (
    (err as { type?: string; status?: number; statusCode?: number }).type === 'entity.too.large' ||
    (err as { status?: number }).status === 413
  ) {
    res.status(413).json({ error: 'Request body is too large' });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Route not found' });
}
