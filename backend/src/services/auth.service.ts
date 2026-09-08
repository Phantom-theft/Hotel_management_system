import { User, UserRole } from '@prisma/client';
import { prisma } from '../config/database';
import { LoginInput, RegisterInput, SafeUser } from '../types/auth.types';
import { AppError, toSafeUser } from '../utils/helpers';
import { comparePassword, hashPassword, hashToken, compareToken } from '../utils/password';
import {
  getRefreshTokenExpiry,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: SafeUser;
  tokens: AuthTokens;
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) {
    throw new AppError(409, 'Email already registered');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      phone: input.phone,
      role: UserRole.customer,
    },
  });

  return issueTokensForUser(user);
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new AppError(403, 'Account is deactivated');
  }

  return issueTokensForUser(user);
}

export async function refreshSession(refreshToken: string): Promise<AuthResult> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  const storedTokens = await prisma.refreshToken.findMany({
    where: {
      userId: payload.sub,
      expiresAt: { gt: new Date() },
    },
  });

  let matchedTokenId: string | null = null;
  for (const stored of storedTokens) {
    if (await compareToken(refreshToken, stored.tokenHash)) {
      matchedTokenId = stored.id;
      break;
    }
  }

  if (!matchedTokenId) {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new AppError(401, 'User not found');
  }
  if (!user.isActive) {
    throw new AppError(403, 'Account is deactivated');
  }

  await prisma.refreshToken.delete({ where: { id: matchedTokenId } });

  return issueTokensForUser(user);
}

export async function logoutUser(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) {
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const storedTokens = await prisma.refreshToken.findMany({
      where: { userId: payload.sub },
    });

    for (const stored of storedTokens) {
      if (await compareToken(refreshToken, stored.tokenHash)) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
        return;
      }
    }
  } catch {
    // Token invalid or already revoked — logout still succeeds
  }
}

async function issueTokensForUser(user: User): Promise<AuthResult> {
  const payload = { sub: user.id, email: user.email, role: user.role };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const tokenHash = await hashToken(refreshToken);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return {
    user: toSafeUser(user),
    tokens: { accessToken, refreshToken },
  };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) {
    throw new AppError(404, 'User not found');
  }

  const matches = await comparePassword(currentPassword, user.passwordHash);
  if (!matches) {
    throw new AppError(400, 'Current password is incorrect');
  }

  if (newPassword.length < 8) {
    throw new AppError(400, 'New password must be at least 8 characters');
  }

  if (currentPassword === newPassword) {
    throw new AppError(400, 'New password must be different from the current password');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
