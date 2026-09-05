import { NextFunction, Request, Response } from 'express';
import * as roomTypeService from '../services/roomType.service';
import { uploadImageFiles } from '../services/cloudinary.service';
import { AppError } from '../utils/helpers';

function mergeImageUrls(
  body: { images?: string[]; imageUrls?: string[] },
  uploaded: string[],
): string[] | undefined {
  const pasted = [...(body.imageUrls ?? []), ...(body.images ?? [])];
  if (!uploaded.length && body.images == null && body.imageUrls == null) {
    return undefined;
  }
  // Deduplicate while preserving order
  return [...new Set([...pasted, ...uploaded])];
}

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
    const files = req.files as Express.Multer.File[] | undefined;
    const uploaded = await uploadImageFiles(files);
    const images = mergeImageUrls(req.body, uploaded) ?? [];

    const roomType = await roomTypeService.createRoomType({
      name: req.body.name,
      basePrice: req.body.basePrice,
      capacity: req.body.capacity,
      amenities: req.body.amenities,
      description: req.body.description,
      images,
    });
    res.status(201).json({ roomType });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    const uploaded = await uploadImageFiles(files);
    const images = mergeImageUrls(req.body, uploaded);

    const hasBodyField = [
      req.body.name,
      req.body.basePrice,
      req.body.capacity,
      req.body.amenities,
      req.body.description,
      images,
    ].some((v) => v !== undefined);

    if (!hasBodyField && !uploaded.length) {
      throw new AppError(400, 'At least one field is required');
    }

    const roomType = await roomTypeService.updateRoomType(
      req.params.id as string,
      {
        name: req.body.name,
        basePrice: req.body.basePrice,
        capacity: req.body.capacity,
        amenities: req.body.amenities,
        description: req.body.description,
        ...(images !== undefined ? { images } : {}),
      },
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
