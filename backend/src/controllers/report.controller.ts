import { NextFunction, Request, Response } from 'express';
import * as reportService from '../services/report.service';

export async function occupancy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await reportService.getOccupancyReport(
      req.query.from as string | undefined,
      req.query.to as string | undefined,
    );
    res.json(report);
  } catch (error) {
    next(error);
  }
}

export async function revenue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await reportService.getRevenueReport(
      req.query.from as string | undefined,
      req.query.to as string | undefined,
    );
    res.json(report);
  } catch (error) {
    next(error);
  }
}

export async function cancellations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await reportService.getCancellationsReport(
      req.query.from as string | undefined,
      req.query.to as string | undefined,
    );
    res.json(report);
  } catch (error) {
    next(error);
  }
}
