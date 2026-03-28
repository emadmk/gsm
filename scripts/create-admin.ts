/**
 * Create admin user for GSM News
 * Usage: npx tsx scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com'
  const password = getRequiredEnv('ADMIN_PASSWORD')
  const name = 'مدیر سایت'

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword, name },
    create: {
      email,
      password: hashedPassword,
      name,
      role: 'ADMIN',
    },
  })

  console.log(`Admin user created/updated: ${user.email}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
