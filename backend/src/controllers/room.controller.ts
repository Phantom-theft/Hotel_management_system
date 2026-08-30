import { NextFunction, Request, Response } from 'express';
import * as roomService from '../services/room.service';

export async function listAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rooms = await roomService.listRooms();
    res.json({ rooms });
  } catch (error) {
    next(error);
  }
}

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rooms = await roomService.searchAvailableRooms({
      checkIn: req.query.checkIn as string | undefined,
      checkOut: req.query.checkOut as string | undefined,
      guests: req.query.guests as string | undefined,
      type: req.query.type as string | undefined,
    });
    res.json({ rooms });
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const room = await roomService.getRoomById(req.params.id as string);
    res.json({ room });
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const room = await roomService.createRoom(req.body);
    res.status(201).json({ room });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const room = await roomService.updateRoom(req.params.id as string, req.body);
    res.json({ room });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await roomService.deleteRoom(req.params.id as string);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
