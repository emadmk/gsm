import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'

const createBrandSchema = z.object({
  name: z.string().min(1, 'نام برند الزامی است'),
  nameEn: z.string().optional(),
  slug: z.string().min(1, 'اسلاگ الزامی است'),
  logo: z.string().optional(),
  description: z.string().optional(),
  priority: z.number().int().default(0),
})

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { priority: 'desc' },
    })

    return NextResponse.json(brands)
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت برندها' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createBrandSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'اطلاعات نامعتبر', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const brand = await prisma.brand.create({
      data: validation.data,
    })

    return NextResponse.json(brand, { status: 201 })
  } catch (error) {
    console.error('Error creating brand:', error)
    return NextResponse.json(
      { error: 'خطا در ایجاد برند' },
      { status: 500 }
    )
  }
}
