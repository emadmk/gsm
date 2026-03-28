import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuthorizedSession } from '@/lib/api-auth'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthorizedSession(request, {
      requiredRole: 'EDITOR',
      enforceSameOrigin: true,
    })
    if (auth.response) {
      return auth.response
    }

    const { id } = await params
    const authorId = parseInt(id)

    if (isNaN(authorId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 })
    }

    const existing = await prisma.author.findUnique({ where: { id: authorId } })
    if (!existing) {
      return NextResponse.json({ error: 'نویسنده یافت نشد' }, { status: 404 })
    }

    const body = await request.json()
    const { name, slug, email, bio, avatar, label } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (email !== undefined) updateData.email = email
    if (bio !== undefined) updateData.bio = bio
    if (avatar !== undefined) updateData.avatar = avatar
    if (label !== undefined) updateData.label = label

    const author = await prisma.author.update({
      where: { id: authorId },
      data: updateData,
    })

    return NextResponse.json(author)
  } catch (error) {
    console.error('Error updating author:', error)
    return NextResponse.json(
      { error: 'خطا در بروزرسانی نویسنده' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthorizedSession(request, {
      requiredRole: 'EDITOR',
      enforceSameOrigin: true,
    })
    if (auth.response) {
      return auth.response
    }

    const { id } = await params
    const authorId = parseInt(id)

    if (isNaN(authorId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 })
    }

    const existing = await prisma.author.findUnique({ where: { id: authorId } })
    if (!existing) {
      return NextResponse.json({ error: 'نویسنده یافت نشد' }, { status: 404 })
    }

    await prisma.author.delete({ where: { id: authorId } })

    return NextResponse.json({ message: 'نویسنده با موفقیت حذف شد' })
  } catch (error) {
    console.error('Error deleting author:', error)
    return NextResponse.json(
      { error: 'خطا در حذف نویسنده' },
      { status: 500 }
    )
  }
}
