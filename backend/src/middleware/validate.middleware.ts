import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/helpers';

type RequestShape = {
  body?: unknown;
  params?: unknown;
  query?: unknown;
};

export function validate(schema: ZodSchema<RequestShape>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid request';
      next(new AppError(400, message));
      return;
    }

    if (parsed.data.body !== undefined) req.body = parsed.data.body;
    next();
  };
}
