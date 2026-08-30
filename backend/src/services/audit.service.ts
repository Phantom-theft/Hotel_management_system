import { prisma } from '../config/database';

export async function writeAuditLog(params: {
  userId?: string | null;
  action: string;
  targetType: string;
  targetId: string;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
    },
  });
}
