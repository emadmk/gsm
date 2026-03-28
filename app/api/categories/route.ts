import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'

const createCategorySchema = z.object({
  name: z.string().min(1, 'نام دسته‌بندی الزامی است'),
  slug: z.string().min(1, 'اسلاگ الزامی است'),
  description: z.string().optional(),
  image: z.string().optional(),
  parentId: z.number().int().optional(),
  order: z.number().int().optional(),
  seoTitle: z.string().optional(),
  seoContent: z.string().optional(),
})

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { articles: true } },
        children: true,
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت دسته‌بندی‌ها' },
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
    const validation = createCategorySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'اطلاعات نامعتبر', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: validation.data,
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'خطا در ایجاد دسته‌بندی' },
      { status: 500 }
    )
  }
}
