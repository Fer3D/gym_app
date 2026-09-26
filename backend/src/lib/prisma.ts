import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  const isRemote = dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://');
  const url = isRemote
    ? dbUrl
    : dbUrl.startsWith('file:')
      ? dbUrl
      : `file:${dbUrl}`;

  const adapter = new PrismaLibSql({
    url,
    ...(isRemote && process.env.TURSO_AUTH_TOKEN
      ? { authToken: process.env.TURSO_AUTH_TOKEN }
      : {}),
  });

  return new PrismaClient({ adapter } as any);
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
