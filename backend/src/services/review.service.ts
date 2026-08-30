import { BookingStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/helpers';

export async function createReview(
  userId: string,
  input: { roomTypeId: string; rating: number; comment?: string },
) {
  const eligible = await prisma.booking.findFirst({
    where: {
      userId,
      status: BookingStatus.checked_out,
      room: { roomTypeId: input.roomTypeId },
    },
    select: { id: true },
  });

  if (!eligible) {
    throw new AppError(403, 'You can review only after a checked-out stay for this room type');
  }

  return prisma.review.create({
    data: {
      userId,
      roomTypeId: input.roomTypeId,
      rating: input.rating,
      comment: input.comment,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });
}

export async function listRoomTypeReviews(
  roomTypeId: string,
  page = 1,
  limit = 10,
) {
  const skip = (page - 1) * limit;

  const [items, total, avg] = await Promise.all([
    prisma.review.findMany({
      where: { roomTypeId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { roomTypeId } }),
    prisma.review.aggregate({
      where: { roomTypeId },
      _avg: { rating: true },
    }),
  ]);

  return {
    page,
    limit,
    total,
    averageRating: avg._avg.rating ?? 0,
    reviews: items,
  };
}
