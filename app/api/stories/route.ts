import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'

const createStorySchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  cover: z.string().optional(),
  items: z.any().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function GET() {
  try {
    const stories = await prisma.story.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(stories)
  } catch (error) {
    console.error('Error fetching stories:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت استوری‌ها' },
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
    const validation = createStorySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'اطلاعات نامعتبر', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const story = await prisma.story.create({
      data: validation.data,
    })

    return NextResponse.json(story, { status: 201 })
  } catch (error) {
    console.error('Error creating story:', error)
    return NextResponse.json(
      { error: 'خطا در ایجاد استوری' },
      { status: 500 }
    )
  }
}
