import { NextFunction, Request, Response } from 'express';
import * as bookingService from '../services/booking.service';
import { AppError } from '../utils/helpers';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const booking = await bookingService.createBooking(req.user.id, req.body);
    res.status(201).json({ booking });
  } catch (error) {
    next(error);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const bookings = await bookingService.listMyBookings(req.user.id);
    res.json({ bookings });
  } catch (error) {
    next(error);
  }
}

export async function listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bookings = await bookingService.listAllBookings();
    res.json({ bookings });
  } catch (error) {
    next(error);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const booking = await bookingService.cancelBooking(req.user.id, req.params.id as string);
    res.json({ booking });
  } catch (error) {
    next(error);
  }
}

export async function today(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await bookingService.getTodaysArrivalsAndDepartures();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }
    const booking = await bookingService.checkInBooking(req.user.id, req.params.id as string);
    res.json({ booking });
  } catch (error) {
    next(error);
  }
}

export async function checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }
    const booking = await bookingService.checkOutBooking(req.user.id, req.params.id as string);
    res.json({ booking });
  } catch (error) {
    next(error);
  }
}

export async function walkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }
    const booking = await bookingService.createWalkInBooking(req.user.id, req.body);
    res.status(201).json({ booking });
  } catch (error) {
    next(error);
  }
}

export async function staffCancel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }
    const booking = await bookingService.cancelBooking(req.user.id, req.params.id as string, {
      asStaff: true,
    });
    res.json({ booking });
  } catch (error) {
    next(error);
  }
}
