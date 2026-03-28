import { NextRequest, NextResponse } from 'next/server'
import { requireAuthorizedSession } from '@/lib/api-auth'
import {
  mapSettingsPayloadToMediaStorageConfig,
  MediaStorageConfigError,
  testMediaStorageConnection,
} from '@/lib/media-storage'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthorizedSession(request, {
      requiredRole: 'ADMIN',
      enforceSameOrigin: true,
    })
    if (auth.response) {
      return auth.response
    }

    const body = await request.json()

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { error: 'تنظیمات نامعتبر است' },
        { status: 400 }
      )
    }

    const result = await testMediaStorageConnection(
      mapSettingsPayloadToMediaStorageConfig(body)
    )

    return NextResponse.json({
      message: 'اتصال و دسترسی نوشتن با موفقیت بررسی شد',
      ...result,
    })
  } catch (error) {
    if (error instanceof MediaStorageConfigError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.error('Error testing media storage connection:', error)

    return NextResponse.json(
      { error: 'اتصال به فضای ذخیره‌سازی برقرار نشد یا دسترسی لازم وجود ندارد' },
      { status: 500 }
    )
  }
}
