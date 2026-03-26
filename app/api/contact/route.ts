import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'

const createContactSchema = z.object({
  name: z.string().min(1, 'نام الزامی است'),
  email: z.string().email('ایمیل نامعتبر است'),
  subject: z.string().min(1, 'موضوع الزامی است'),
  message: z.string().min(1, 'پیام الزامی است'),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contactMessage.count(),
    ])

    return NextResponse.json({
      messages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching contact messages:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت پیام‌ها' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = createContactSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'اطلاعات نامعتبر', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const message = await prisma.contactMessage.create({
      data: validation.data,
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating contact message:', error)
    return NextResponse.json(
      { error: 'خطا در ارسال پیام' },
      { status: 500 }
    )
  }
}
