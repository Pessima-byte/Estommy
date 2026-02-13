import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma_v4: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma_v4 ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_v4 = prisma;
// Regenerated schema to include amountPaid, status, notes, image, and attachment
// Forced reload to pick up latest schema changes

