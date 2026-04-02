import { NextRequest, NextResponse } from 'next/server'
import {
  saveStoredStrapiImportConnectionSettings,
  getStoredStrapiImportConnectionSettings,
} from '@/lib/imports/strapi-settings'
import { strapiConnectionSettingsSchema } from '@/lib/imports/strapi-schemas'
import { requireAuthorizedSession } from '@/lib/api-auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedSession(request, { requiredRole: 'ADMIN' })
  if (auth.response) {
    return auth.response
  }

  const settings = await getStoredStrapiImportConnectionSettings()
  return NextResponse.json(settings)
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthorizedSession(request, {
    requiredRole: 'ADMIN',
    enforceSameOrigin: true,
  })
  if (auth.response) {
    return auth.response
  }

  const body = await request.json()
  const parsed = strapiConnectionSettingsSchema.safeParse(body)

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
    const settings = await saveStoredStrapiImportConnectionSettings(parsed.data)
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'ذخیره تنظیمات اتصال Strapi ناموفق بود',
      },
      { status: 400 }
    )
  }
}
