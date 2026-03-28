import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuthorizedSession } from '@/lib/api-auth'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthorizedSession(request, { requiredRole: 'EDITOR' })
    if (auth.response) {
      return auth.response
    }

    const { id } = await params
    const brandId = parseInt(id)

    if (isNaN(brandId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 })
    }

    const brand = await prisma.brand.findUnique({ where: { id: brandId } })
    if (!brand) {
      return NextResponse.json({ error: 'برند یافت نشد' }, { status: 404 })
    }

    return NextResponse.json(brand)
  } catch (error) {
    console.error('Error fetching brand:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت برند' },
      { status: 500 }
    )
  }
}

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
    const brandId = parseInt(id)

    if (isNaN(brandId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 })
    }

    const existing = await prisma.brand.findUnique({ where: { id: brandId } })
    if (!existing) {
      return NextResponse.json({ error: 'برند یافت نشد' }, { status: 404 })
    }

    const body = await request.json()
    const { name, nameEn, slug, logo, description, priority } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (nameEn !== undefined) updateData.nameEn = nameEn
    if (slug !== undefined) updateData.slug = slug
    if (logo !== undefined) updateData.logo = logo
    if (description !== undefined) updateData.description = description
    if (priority !== undefined) updateData.priority = priority

    const brand = await prisma.brand.update({
      where: { id: brandId },
      data: updateData,
    })

    return NextResponse.json(brand)
  } catch (error) {
    console.error('Error updating brand:', error)
    return NextResponse.json(
      { error: 'خطا در بروزرسانی برند' },
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
    const brandId = parseInt(id)

    if (isNaN(brandId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 })
    }

    const existing = await prisma.brand.findUnique({ where: { id: brandId } })
    if (!existing) {
      return NextResponse.json({ error: 'برند یافت نشد' }, { status: 404 })
    }

    await prisma.brand.delete({ where: { id: brandId } })

    return NextResponse.json({ message: 'برند با موفقیت حذف شد' })
  } catch (error) {
    console.error('Error deleting brand:', error)
    return NextResponse.json(
      { error: 'خطا در حذف برند' },
      { status: 500 }
    )
  }
}
