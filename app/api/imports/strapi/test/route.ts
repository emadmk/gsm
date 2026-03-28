import { NextRequest, NextResponse } from 'next/server'
import { inspectStrapiConnection } from '@/lib/imports/strapi-importer'
import { strapiConnectionSchema } from '@/lib/imports/strapi-schemas'
import { requireAuthorizedSession } from '@/lib/api-auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const auth = await requireAuthorizedSession(request, {
    requiredRole: 'ADMIN',
    enforceSameOrigin: true,
  })
  if (auth.response) {
    return auth.response
  }

  const body = await request.json()
  const parsed = strapiConnectionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'تنظیمات اتصال نامعتبر است',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    )
  }

  try {
    const result = await inspectStrapiConnection(parsed.data)
    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'اتصال به Strapi برقرار نشد'

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}
