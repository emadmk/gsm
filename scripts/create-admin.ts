/**
 * Create admin user for GSM News
 * Usage: npx ts-node scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@gsm.ir'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
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
