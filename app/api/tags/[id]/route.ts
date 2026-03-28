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
    const tagId = parseInt(id)

    if (isNaN(tagId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 })
    }

    const existing = await prisma.tag.findUnique({ where: { id: tagId } })
    if (!existing) {
      return NextResponse.json({ error: 'تگ یافت نشد' }, { status: 404 })
    }

    const body = await request.json()
    const { name, slug } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug

    const tag = await prisma.tag.update({
      where: { id: tagId },
      data: updateData,
    })

    return NextResponse.json(tag)
  } catch (error) {
    console.error('Error updating tag:', error)
    return NextResponse.json(
      { error: 'خطا در بروزرسانی تگ' },
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
    const tagId = parseInt(id)

    if (isNaN(tagId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 })
    }

    const existing = await prisma.tag.findUnique({ where: { id: tagId } })
    if (!existing) {
      return NextResponse.json({ error: 'تگ یافت نشد' }, { status: 404 })
    }

    await prisma.tag.delete({ where: { id: tagId } })

    return NextResponse.json({ message: 'تگ با موفقیت حذف شد' })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json(
      { error: 'خطا در حذف تگ' },
      { status: 500 }
    )
  }
}
