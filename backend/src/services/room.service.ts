import { BookingStatus, Prisma, RoomStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/helpers';
import {
  assertValidStayRange,
  decimalToNumber,
  parseDateParam,
} from '../utils/booking';
import { blockingOverlapWhere } from '../utils/availability';
import { serializeRoomType } from './roomType.service';

export interface CreateRoomInput {
  roomTypeId: string;
  roomNumber: string;
  floor: number;
  status?: RoomStatus;
}

export interface UpdateRoomInput {
  roomTypeId?: string;
  roomNumber?: string;
  floor?: number;
  status?: RoomStatus;
}

export interface SearchRoomsQuery {
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  type?: string;
}

function serializeRoom(room: {
  id: string;
  roomTypeId: string;
  roomNumber: string;
  floor: number;
  status: RoomStatus;
  roomType?: {
    id: string;
    name: string;
    basePrice: Prisma.Decimal;
    capacity: number;
    amenities: string[];
    images: string[];
    description: string | null;
  };
}) {
  return {
    id: room.id,
    roomTypeId: room.roomTypeId,
    roomNumber: room.roomNumber,
    floor: room.floor,
    status: room.status,
    ...(room.roomType ? { roomType: serializeRoomType(room.roomType) } : {}),
  };
}

export async function listRooms() {
  const rooms = await prisma.room.findMany({
    include: { roomType: true },
    orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
  });
  return rooms.map(serializeRoom);
}

export async function getRoomById(id: string) {
  const room = await prisma.room.findUnique({
    where: { id },
    include: { roomType: true },
  });
  if (!room) {
    throw new AppError(404, 'Room not found');
  }
  return serializeRoom(room);
}

export async function createRoom(input: CreateRoomInput) {
  if (!input.roomTypeId || !input.roomNumber?.trim()) {
    throw new AppError(400, 'roomTypeId and roomNumber are required');
  }
  if (input.floor == null || Number.isNaN(Number(input.floor))) {
    throw new AppError(400, 'floor is required');
  }

  const roomType = await prisma.roomType.findUnique({ where: { id: input.roomTypeId } });
  if (!roomType) {
    throw new AppError(404, 'Room type not found');
  }

  const existing = await prisma.room.findUnique({
    where: { roomNumber: input.roomNumber.trim() },
  });
  if (existing) {
    throw new AppError(409, 'Room number already exists');
  }

  if (input.status && !Object.values(RoomStatus).includes(input.status)) {
    throw new AppError(400, 'Invalid room status');
  }

  const room = await prisma.room.create({
    data: {
      roomTypeId: input.roomTypeId,
      roomNumber: input.roomNumber.trim(),
      floor: input.floor,
      status: input.status ?? RoomStatus.available,
    },
    include: { roomType: true },
  });

  return serializeRoom(room);
}

export async function updateRoom(id: string, input: UpdateRoomInput) {
  await getRoomById(id);

  if (input.roomTypeId) {
    const roomType = await prisma.roomType.findUnique({ where: { id: input.roomTypeId } });
    if (!roomType) {
      throw new AppError(404, 'Room type not found');
    }
  }

  if (input.roomNumber) {
    const existing = await prisma.room.findFirst({
      where: {
        roomNumber: input.roomNumber.trim(),
        NOT: { id },
      },
    });
    if (existing) {
      throw new AppError(409, 'Room number already exists');
    }
  }

  if (input.status && !Object.values(RoomStatus).includes(input.status)) {
    throw new AppError(400, 'Invalid room status');
  }

  const room = await prisma.room.update({
    where: { id },
    data: {
      ...(input.roomTypeId != null ? { roomTypeId: input.roomTypeId } : {}),
      ...(input.roomNumber != null ? { roomNumber: input.roomNumber.trim() } : {}),
      ...(input.floor != null ? { floor: input.floor } : {}),
      ...(input.status != null ? { status: input.status } : {}),
    },
    include: { roomType: true },
  });

  return serializeRoom(room);
}

export async function deleteRoom(id: string) {
  await getRoomById(id);

  const activeBookings = await prisma.booking.count({
    where: {
      roomId: id,
      status: { not: BookingStatus.cancelled },
      checkOut: { gt: new Date() },
    },
  });
  if (activeBookings > 0) {
    throw new AppError(409, 'Cannot delete room with active or upcoming bookings');
  }

  await prisma.room.delete({ where: { id } });
}

/**
 * Public search: rooms available for the given stay window (optional filters).
 * Excludes rooms with any overlapping non-cancelled booking.
 */
export async function searchAvailableRooms(query: SearchRoomsQuery) {
  if (!query.checkIn || !query.checkOut) {
    throw new AppError(400, 'checkIn and checkOut query params are required');
  }

  const checkIn = parseDateParam(query.checkIn, 'checkIn');
  const checkOut = parseDateParam(query.checkOut, 'checkOut');
  assertValidStayRange(checkIn, checkOut);

  const guests = query.guests != null ? parseInt(query.guests, 10) : undefined;
  if (guests != null && (Number.isNaN(guests) || guests < 1)) {
    throw new AppError(400, 'guests must be a positive integer');
  }

  const where: Prisma.RoomWhereInput = {
    status: { not: RoomStatus.maintenance },
    ...(query.type ? { roomTypeId: query.type } : {}),
    ...(guests != null ? { roomType: { capacity: { gte: guests } } } : {}),
    bookings: {
      none: blockingOverlapWhere(checkIn, checkOut),
    },
  };

  const rooms = await prisma.room.findMany({
    where,
    include: { roomType: true },
    orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
  });

  return rooms.map(serializeRoom);
}

export { serializeRoom };
