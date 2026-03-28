import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const commentId = parseInt(id)

    if (isNaN(commentId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 })
    }

    const existing = await prisma.comment.findUnique({ where: { id: commentId } })
    if (!existing) {
      return NextResponse.json({ error: 'نظر یافت نشد' }, { status: 404 })
    }

    const body = await request.json()
    const { isApproved, isAdmin, content } = body

    const updateData: Record<string, unknown> = {}
    if (isApproved !== undefined) updateData.isApproved = isApproved
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin
    if (content !== undefined) updateData.content = content

    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: updateData,
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json(
      { error: 'خطا در بروزرسانی نظر' },
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
    const commentId = parseInt(id)

    if (isNaN(commentId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 })
    }

    const existing = await prisma.comment.findUnique({ where: { id: commentId } })
    if (!existing) {
      return NextResponse.json({ error: 'نظر یافت نشد' }, { status: 404 })
    }

    await prisma.comment.delete({ where: { id: commentId } })

    return NextResponse.json({ message: 'نظر با موفقیت حذف شد' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'خطا در حذف نظر' },
      { status: 500 }
    )
  }
}
