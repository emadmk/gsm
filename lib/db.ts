// Prisma client will be initialized after running `npx prisma generate`
// For now, using a placeholder to allow build without database connection

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prisma: any = null

try {
  // Dynamic import to prevent build errors when Prisma client is not generated
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('@prisma/client')

  const globalForPrisma = globalThis as unknown as {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma: any | undefined
  }

  prisma = globalForPrisma.prisma ?? new PrismaClient()

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
  }
} catch {
  // Prisma client not yet generated - this is expected during initial build
  console.warn('Prisma client not found. Run `npx prisma generate` first.')
}

export { prisma }
export default prisma
