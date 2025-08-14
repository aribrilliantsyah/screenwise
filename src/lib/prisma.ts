
import { PrismaClient } from '@prisma/client';

// This is the correct way to instantiate Prisma Client in Next.js.
// It prevents multiple instances of Prisma Client from being created in development.
// See: https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    // log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
