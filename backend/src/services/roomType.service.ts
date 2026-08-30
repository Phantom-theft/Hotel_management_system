import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/helpers';
import { decimalToNumber } from '../utils/booking';
import { writeAuditLog } from './audit.service';

export interface CreateRoomTypeInput {
  name: string;
  basePrice: number;
  capacity: number;
  amenities?: string[];
  images?: string[];
  description?: string;
}

export interface UpdateRoomTypeInput {
  name?: string;
  basePrice?: number;
  capacity?: number;
  amenities?: string[];
  images?: string[];
  description?: string | null;
}

function serializeRoomType(roomType: {
  id: string;
  name: string;
  basePrice: Prisma.Decimal;
  capacity: number;
  amenities: string[];
  images: string[];
  description: string | null;
}) {
  return {
    id: roomType.id,
    name: roomType.name,
    basePrice: decimalToNumber(roomType.basePrice),
    capacity: roomType.capacity,
    amenities: roomType.amenities,
    images: roomType.images,
    description: roomType.description,
  };
}

export async function listRoomTypes() {
  const roomTypes = await prisma.roomType.findMany({ orderBy: { name: 'asc' } });
  return roomTypes.map(serializeRoomType);
}

export async function getRoomTypeById(id: string) {
  const roomType = await prisma.roomType.findUnique({ where: { id } });
  if (!roomType) {
    throw new AppError(404, 'Room type not found');
  }
  return serializeRoomType(roomType);
}

export async function createRoomType(input: CreateRoomTypeInput) {
  if (!input.name?.trim()) {
    throw new AppError(400, 'Name is required');
  }
  if (input.basePrice == null || input.basePrice < 0) {
    throw new AppError(400, 'basePrice must be a non-negative number');
  }
  if (!input.capacity || input.capacity < 1) {
    throw new AppError(400, 'capacity must be at least 1');
  }

  const roomType = await prisma.roomType.create({
    data: {
      name: input.name.trim(),
      basePrice: input.basePrice,
      capacity: input.capacity,
      amenities: input.amenities ?? [],
      images: input.images ?? [],
      description: input.description,
    },
  });

  return serializeRoomType(roomType);
}

export async function updateRoomType(
  id: string,
  input: UpdateRoomTypeInput,
  actorUserId?: string,
) {
  const existing = await prisma.roomType.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Room type not found');
  }

  if (input.basePrice != null && input.basePrice < 0) {
    throw new AppError(400, 'basePrice must be a non-negative number');
  }
  if (input.capacity != null && input.capacity < 1) {
    throw new AppError(400, 'capacity must be at least 1');
  }

  const roomType = await prisma.roomType.update({
    where: { id },
    data: {
      ...(input.name != null ? { name: input.name.trim() } : {}),
      ...(input.basePrice != null ? { basePrice: input.basePrice } : {}),
      ...(input.capacity != null ? { capacity: input.capacity } : {}),
      ...(input.amenities != null ? { amenities: input.amenities } : {}),
      ...(input.images != null ? { images: input.images } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
  });

  if (
    actorUserId &&
    input.basePrice != null &&
    decimalToNumber(existing.basePrice) !== input.basePrice
  ) {
    await writeAuditLog({
      userId: actorUserId,
      action: `room_type.price_changed:${decimalToNumber(existing.basePrice)}->${input.basePrice}`,
      targetType: 'RoomType',
      targetId: id,
    });
  }

  return serializeRoomType(roomType);
}

export async function deleteRoomType(id: string) {
  await getRoomTypeById(id);

  const roomCount = await prisma.room.count({ where: { roomTypeId: id } });
  if (roomCount > 0) {
    throw new AppError(409, 'Cannot delete room type that still has rooms');
  }

  await prisma.roomType.delete({ where: { id } });
}

export { serializeRoomType };
