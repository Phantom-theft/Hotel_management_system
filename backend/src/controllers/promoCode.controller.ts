import { NextFunction, Request, Response } from 'express';
import * as promoCodeService from '../services/promoCode.service';

export async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const promoCodes = await promoCodeService.listPromoCodes();
    res.json({ promoCodes });
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const promoCode = await promoCodeService.createPromoCode(req.body);
    res.status(201).json({ promoCode });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const promoCode = await promoCodeService.updatePromoCode(req.params.id as string, req.body);
    res.json({ promoCode });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await promoCodeService.deletePromoCode(req.params.id as string);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function validate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const code = req.query.code as string;
    const result = await promoCodeService.checkPromoCode(code);
    // Always 200 with a minimal shape — no 404/409 distinction that aids enumeration
    res.json(result);
  } catch (error) {
    next(error);
  }
}
