import crypto from 'crypto';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, toSafeUser } from '../utils/helpers';
import { hashPassword } from '../utils/password';
import { writeAuditLog } from './audit.service';
import { sendStaffInviteEmail } from './email.service';

export async function inviteStaff(
  adminUserId: string,
  input: { name: string; email: string; role: UserRole; phone?: string },
) {
  if (!input.name?.trim() || !input.email?.trim()) {
    throw new AppError(400, 'name and email are required');
  }
  if (input.role !== UserRole.staff && input.role !== UserRole.admin) {
    throw new AppError(400, 'role must be staff or admin');
  }

  const existing = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });
  if (existing) {
    throw new AppError(409, 'Email already registered');
  }

  const tempPassword = crypto.randomBytes(9).toString('base64url');
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: input.email.toLowerCase(),
      phone: input.phone,
      role: input.role,
      passwordHash,
      isActive: true,
    },
  });

  await writeAuditLog({
    userId: adminUserId,
    action: 'staff.invited',
    targetType: 'User',
    targetId: user.id,
  });

  try {
    await sendStaffInviteEmail({
      to: user.email,
      name: user.name,
      role: user.role,
      tempPassword,
    });
  } catch (err) {
    console.error('Failed to send staff invite email', err);
  }

  return { user: toSafeUser(user), tempPassword };
}

export async function assignStaffRole(
  adminUserId: string,
  userId: string,
  role: UserRole,
) {
  if (role !== UserRole.staff && role !== UserRole.admin && role !== UserRole.customer) {
    throw new AppError(400, 'Invalid role');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  await writeAuditLog({
    userId: adminUserId,
    action: `staff.role_changed:${user.role}->${role}`,
    targetType: 'User',
    targetId: userId,
  });

  return toSafeUser(updated);
}

export async function deactivateStaff(adminUserId: string, userId: string) {
  if (adminUserId === userId) {
    throw new AppError(400, 'Cannot deactivate your own account');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  await prisma.refreshToken.deleteMany({ where: { userId } });

  await writeAuditLog({
    userId: adminUserId,
    action: 'staff.deactivated',
    targetType: 'User',
    targetId: userId,
  });

  return toSafeUser(updated);
}

export async function reactivateStaff(adminUserId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (user.isActive) {
    throw new AppError(400, 'Account is already active');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
  });

  await writeAuditLog({
    userId: adminUserId,
    action: 'staff.reactivated',
    targetType: 'User',
    targetId: userId,
  });

  return toSafeUser(updated);
}

export async function listStaff() {
  const users = await prisma.user.findMany({
    where: { role: { in: [UserRole.staff, UserRole.admin] } },
    orderBy: { createdAt: 'desc' },
  });
  return users.map(toSafeUser);
}
