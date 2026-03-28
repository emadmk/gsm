import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const articleId = parseInt(id)

    if (isNaN(articleId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 })
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } },
        comments: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          include: {
            replies: {
              where: { isApproved: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    })

    if (!article) {
      return NextResponse.json({ error: 'مقاله یافت نشد' }, { status: 404 })
    }

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت مقاله' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const articleId = parseInt(id)

    if (isNaN(articleId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 })
    }

    const existing = await prisma.article.findUnique({ where: { id: articleId } })
    if (!existing) {
      return NextResponse.json({ error: 'مقاله یافت نشد' }, { status: 404 })
    }

    const body = await request.json()
    const { tagIds, publishedAt, ...data } = body

    const updateData: Record<string, unknown> = { ...data }

    if (publishedAt !== undefined) {
      updateData.publishedAt = publishedAt ? new Date(publishedAt) : null
    }

    // If status changes to PUBLISHED and no publishedAt set, set it now
    if (data.status === 'PUBLISHED' && !existing.publishedAt && !publishedAt) {
      updateData.publishedAt = new Date()
    }

    updateData.modifiedAt = new Date()

    // Handle tag updates
    if (tagIds !== undefined) {
      await prisma.articleTag.deleteMany({ where: { articleId } })
      if (tagIds.length > 0) {
        await prisma.articleTag.createMany({
          data: tagIds.map((tagId: number) => ({ articleId, tagId })),
        })
      }
    }

    const article = await prisma.article.update({
      where: { id: articleId },
      data: updateData,
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json(
      { error: 'خطا در بروزرسانی مقاله' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const articleId = parseInt(id)

    if (isNaN(articleId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 })
    }

    const existing = await prisma.article.findUnique({ where: { id: articleId } })
    if (!existing) {
      return NextResponse.json({ error: 'مقاله یافت نشد' }, { status: 404 })
    }

    await prisma.article.delete({ where: { id: articleId } })

    return NextResponse.json({ message: 'مقاله با موفقیت حذف شد' })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: 'خطا در حذف مقاله' },
      { status: 500 }
    )
  }
}
