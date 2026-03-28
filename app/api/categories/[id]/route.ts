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
    const categoryId = parseInt(id)

    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 })
    }

    const existing = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!existing) {
      return NextResponse.json({ error: 'دسته‌بندی یافت نشد' }, { status: 404 })
    }

    const body = await request.json()
    const { name, slug, description, image, parentId, order, seoTitle, seoContent } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (description !== undefined) updateData.description = description
    if (image !== undefined) updateData.image = image
    if (parentId !== undefined) updateData.parentId = parentId ? parseInt(parentId) : null
    if (order !== undefined) updateData.order = order
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle
    if (seoContent !== undefined) updateData.seoContent = seoContent

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'خطا در بروزرسانی دسته‌بندی' },
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
    const categoryId = parseInt(id)

    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 })
    }

    const existing = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!existing) {
      return NextResponse.json({ error: 'دسته‌بندی یافت نشد' }, { status: 404 })
    }

    await prisma.category.delete({ where: { id: categoryId } })

    return NextResponse.json({ message: 'دسته‌بندی با موفقیت حذف شد' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'خطا در حذف دسته‌بندی' },
      { status: 500 }
    )
  }
}
