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
    const adId = parseInt(id)

    if (isNaN(adId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 })
    }

    const existing = await prisma.ad.findUnique({ where: { id: adId } })
    if (!existing) {
      return NextResponse.json({ error: 'تبلیغ یافت نشد' }, { status: 404 })
    }

    const body = await request.json()
    const { zone, title, content, imageUrl, linkUrl, isActive, order } = body

    const updateData: Record<string, unknown> = {}
    if (zone !== undefined) updateData.zone = zone
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (linkUrl !== undefined) updateData.linkUrl = linkUrl
    if (isActive !== undefined) updateData.isActive = isActive
    if (order !== undefined) updateData.order = order

    const ad = await prisma.ad.update({
      where: { id: adId },
      data: updateData,
    })

    return NextResponse.json(ad)
  } catch (error) {
    console.error('Error updating ad:', error)
    return NextResponse.json(
      { error: 'خطا در بروزرسانی تبلیغ' },
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
    const adId = parseInt(id)

    if (isNaN(adId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 })
    }

    const existing = await prisma.ad.findUnique({ where: { id: adId } })
    if (!existing) {
      return NextResponse.json({ error: 'تبلیغ یافت نشد' }, { status: 404 })
    }

    await prisma.ad.delete({ where: { id: adId } })

    return NextResponse.json({ message: 'تبلیغ با موفقیت حذف شد' })
  } catch (error) {
    console.error('Error deleting ad:', error)
    return NextResponse.json(
      { error: 'خطا در حذف تبلیغ' },
      { status: 500 }
    )
  }
}
