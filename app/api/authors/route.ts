import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { requireAuthorizedSession } from '@/lib/api-auth'

const createAuthorSchema = z.object({
  name: z.string().min(1, 'نام نویسنده الزامی است'),
  slug: z.string().min(1, 'اسلاگ الزامی است'),
  email: z.string().email().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  label: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthorizedSession(request, { requiredRole: 'EDITOR' })
    if (auth.response) {
      return auth.response
    }

    const authors = await prisma.author.findMany({
      include: {
        _count: { select: { articles: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(authors)
  } catch (error) {
    console.error('Error fetching authors:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت نویسندگان' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthorizedSession(request, {
      requiredRole: 'EDITOR',
      enforceSameOrigin: true,
    })
    if (auth.response) {
      return auth.response
    }

    const body = await request.json()
    const validation = createAuthorSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'اطلاعات نامعتبر', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const author = await prisma.author.create({
      data: validation.data,
    })

    return NextResponse.json(author, { status: 201 })
  } catch (error) {
    console.error('Error creating author:', error)
    return NextResponse.json(
      { error: 'خطا در ایجاد نویسنده' },
      { status: 500 }
    )
  }
}
