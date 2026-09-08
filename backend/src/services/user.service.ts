import { prisma } from '../config/database';
import { AppError, toSafeUser } from '../utils/helpers';
import { SafeUser } from '../types/auth.types';

export interface UpdateMeInput {
  name?: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

export async function getCurrentUser(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) {
    throw new AppError(404, 'User not found');
  }
  return toSafeUser(user);
}

export async function updateCurrentUser(
  userId: string,
  input: UpdateMeInput,
): Promise<SafeUser> {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing || !existing.isActive) {
    throw new AppError(404, 'User not found');
  }

  if (input.name !== undefined && !input.name.trim()) {
    throw new AppError(400, 'Name is required');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
    },
  });

  return toSafeUser(user);
}
