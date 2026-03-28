import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { requireAuthorizedSession } from '@/lib/api-auth'

const adSchema = z.object({
  id: z.number().int().optional(),
  zone: z.string().min(1, 'موقعیت تبلیغ الزامی است'),
  title: z.string().optional(),
  content: z.string().optional(),
  imageUrl: z.string().optional(),
  linkUrl: z.string().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthorizedSession(request, { requiredRole: 'EDITOR' })
    if (auth.response) {
      return auth.response
    }

    const { searchParams } = new URL(request.url)
    const zone = searchParams.get('zone')

    const where: Record<string, unknown> = {}

    if (zone) {
      where.zone = zone
    }

    const ads = await prisma.ad.findMany({
      where,
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(ads)
  } catch (error) {
    console.error('Error fetching ads:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت تبلیغات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthorizedSession(request, {
      requiredRole: 'EDITOR',
      enforceSameOrigin: true,
    })
    if (auth.response) {
      return auth.response
    }

    const body = await request.json()
    const validation = adSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'اطلاعات نامعتبر', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { id, ...data } = validation.data

    // If id is provided, update existing ad; otherwise create new
    if (id) {
      const existing = await prisma.ad.findUnique({ where: { id } })
      if (!existing) {
        return NextResponse.json({ error: 'تبلیغ یافت نشد' }, { status: 404 })
      }

      const ad = await prisma.ad.update({
        where: { id },
        data,
      })

      return NextResponse.json(ad)
    }

    const ad = await prisma.ad.create({
      data,
    })

    return NextResponse.json(ad, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating ad:', error)
    return NextResponse.json(
      { error: 'خطا در ذخیره تبلیغ' },
      { status: 500 }
    )
  }
}
