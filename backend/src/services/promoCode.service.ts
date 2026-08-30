import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/helpers';

export async function listPromoCodes() {
  return prisma.promoCode.findMany({ orderBy: { validFrom: 'desc' } });
}

export async function createPromoCode(input: {
  code: string;
  discountPercent: number;
  validFrom: string;
  validTo: string;
  maxUses: number;
}) {
  const validFrom = new Date(input.validFrom);
  const validTo = new Date(input.validTo);
  if (validTo <= validFrom) throw new AppError(400, 'validTo must be after validFrom');

  return prisma.promoCode.create({
    data: {
      code: input.code.toUpperCase(),
      discountPercent: input.discountPercent,
      validFrom,
      validTo,
      maxUses: input.maxUses,
    },
  });
}

export async function updatePromoCode(
  id: string,
  input: Partial<{
    code: string;
    discountPercent: number;
    validFrom: string;
    validTo: string;
    maxUses: number;
    usedCount: number;
  }>,
) {
  return prisma.promoCode.update({
    where: { id },
    data: {
      ...(input.code ? { code: input.code.toUpperCase() } : {}),
      ...(input.discountPercent !== undefined ? { discountPercent: input.discountPercent } : {}),
      ...(input.validFrom ? { validFrom: new Date(input.validFrom) } : {}),
      ...(input.validTo ? { validTo: new Date(input.validTo) } : {}),
      ...(input.maxUses !== undefined ? { maxUses: input.maxUses } : {}),
      ...(input.usedCount !== undefined ? { usedCount: input.usedCount } : {}),
    },
  });
}

export async function deletePromoCode(id: string) {
  await prisma.promoCode.delete({ where: { id } });
}

/**
 * Atomically reserves a promo usage inside an existing transaction.
 * Returns discount percent for pricing.
 */
export async function reservePromoCode(
  tx: Prisma.TransactionClient,
  code: string,
): Promise<{ promoId: string; code: string; discountPercent: number }> {
  const now = new Date();
  const normalized = code.toUpperCase();

  const promo = await tx.promoCode.findUnique({ where: { code: normalized } });
  if (!promo) {
    throw new AppError(404, 'Promo code not found');
  }
  if (promo.validFrom > now || promo.validTo < now) {
    throw new AppError(409, 'Promo code is not active');
  }
  if (promo.usedCount >= promo.maxUses) {
    throw new AppError(409, 'Promo code is invalid, expired, or fully used');
  }

  const update = await tx.promoCode.updateMany({
    where: { id: promo.id, usedCount: promo.usedCount },
    data: { usedCount: { increment: 1 } },
  });
  if (update.count === 0) {
    throw new AppError(409, 'Promo code just reached max uses; retry');
  }

  return { promoId: promo.id, code: promo.code, discountPercent: promo.discountPercent };
}

/**
 * Read-only promo check for booking UI preview (does not increment usedCount).
 * Returns a minimal, non-enumerating payload: never leaks usedCount/maxUses or
 * distinguishes unknown vs expired vs exhausted codes.
 */
export async function checkPromoCode(
  code: string,
): Promise<{ valid: true; discountPercent: number } | { valid: false }> {
  const now = new Date();
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { valid: false };
  }

  const promo = await prisma.promoCode.findUnique({ where: { code: normalized } });
  if (!promo) {
    return { valid: false };
  }
  if (promo.validFrom > now || promo.validTo < now) {
    return { valid: false };
  }
  if (promo.usedCount >= promo.maxUses) {
    return { valid: false };
  }

  return { valid: true, discountPercent: promo.discountPercent };
}
