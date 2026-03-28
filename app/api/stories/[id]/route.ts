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
    const storyId = parseInt(id)

    if (isNaN(storyId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 })
    }

    const existing = await prisma.story.findUnique({ where: { id: storyId } })
    if (!existing) {
      return NextResponse.json({ error: 'استوری یافت نشد' }, { status: 404 })
    }

    const body = await request.json()
    const { title, cover, items, order, isActive } = body

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (cover !== undefined) updateData.cover = cover
    if (items !== undefined) updateData.items = items
    if (order !== undefined) updateData.order = order
    if (isActive !== undefined) updateData.isActive = isActive

    const story = await prisma.story.update({
      where: { id: storyId },
      data: updateData,
    })

    return NextResponse.json(story)
  } catch (error) {
    console.error('Error updating story:', error)
    return NextResponse.json(
      { error: 'خطا در بروزرسانی استوری' },
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
    const storyId = parseInt(id)

    if (isNaN(storyId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 })
    }

    const existing = await prisma.story.findUnique({ where: { id: storyId } })
    if (!existing) {
      return NextResponse.json({ error: 'استوری یافت نشد' }, { status: 404 })
    }

    await prisma.story.delete({ where: { id: storyId } })

    return NextResponse.json({ message: 'استوری با موفقیت حذف شد' })
  } catch (error) {
    console.error('Error deleting story:', error)
    return NextResponse.json(
      { error: 'خطا در حذف استوری' },
      { status: 500 }
    )
  }
}
