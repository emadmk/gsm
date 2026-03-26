import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'

const createCommentSchema = z.object({
  authorName: z.string().min(1, 'نام الزامی است'),
  authorEmail: z.string().email('ایمیل نامعتبر').optional(),
  content: z.string().min(1, 'متن نظر الزامی است'),
  articleId: z.number().int(),
  parentId: z.number().int().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('articleId')
    const isApproved = searchParams.get('isApproved')

    const where: Record<string, unknown> = {}

    if (articleId) {
      where.articleId = parseInt(articleId)
    }
    if (isApproved !== null && isApproved !== undefined && isApproved !== '') {
      where.isApproved = isApproved === 'true'
    }

    const comments = await prisma.comment.findMany({
      where,
      include: {
        article: { select: { id: true, title: true, slug: true } },
        replies: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت نظرات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = createCommentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'اطلاعات نامعتبر', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { articleId, parentId, ...data } = validation.data

    // Verify article exists
    const article = await prisma.article.findUnique({ where: { id: articleId } })
    if (!article) {
      return NextResponse.json({ error: 'مقاله یافت نشد' }, { status: 404 })
    }

    // Verify parent comment exists if parentId provided
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({ where: { id: parentId } })
      if (!parentComment) {
        return NextResponse.json({ error: 'نظر والد یافت نشد' }, { status: 404 })
      }
    }

    const comment = await prisma.comment.create({
      data: {
        ...data,
        articleId,
        parentId: parentId || null,
        isApproved: false,
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'خطا در ثبت نظر' },
      { status: 500 }
    )
  }
}
