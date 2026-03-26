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

    const existing = await prisma.contactMessage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'پیام یافت نشد' }, { status: 404 })
    }

    const body = await request.json()
    const { isRead } = body

    const message = await prisma.contactMessage.update({
      where: { id },
      data: { isRead: Boolean(isRead) },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error updating contact message:', error)
    return NextResponse.json(
      { error: 'خطا در بروزرسانی پیام' },
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

    const existing = await prisma.contactMessage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'پیام یافت نشد' }, { status: 404 })
    }

    await prisma.contactMessage.delete({ where: { id } })

    return NextResponse.json({ message: 'پیام با موفقیت حذف شد' })
  } catch (error) {
    console.error('Error deleting contact message:', error)
    return NextResponse.json(
      { error: 'خطا در حذف پیام' },
      { status: 500 }
    )
  }
}
