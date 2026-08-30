import { NextFunction, Request, Response } from 'express';
import * as roomTypeService from '../services/roomType.service';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomTypes = await roomTypeService.listRoomTypes();
    res.json({ roomTypes });
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomType = await roomTypeService.getRoomTypeById(req.params.id as string);
    res.json({ roomType });
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomType = await roomTypeService.createRoomType(req.body);
    res.status(201).json({ roomType });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomType = await roomTypeService.updateRoomType(
      req.params.id as string,
      req.body,
      req.user?.id,
    );
    res.json({ roomType });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await roomTypeService.deleteRoomType(req.params.id as string);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
