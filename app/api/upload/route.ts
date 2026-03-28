import { NextRequest, NextResponse } from 'next/server'
import { requireAuthorizedSession } from '@/lib/api-auth'
import {
  MediaStorageConfigError,
  uploadFileToMediaStorage,
} from '@/lib/media-storage'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthorizedSession(request, {
      requiredRole: 'EDITOR',
      enforceSameOrigin: true,
    })
    if (auth.response) {
      return auth.response
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'فایلی انتخاب نشده' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'فرمت فایل مجاز نیست. فرمت‌های مجاز: JPEG, PNG, WebP, GIF, SVG' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'حجم فایل نباید بیشتر از ۱۰ مگابایت باشد' },
        { status: 400 }
      )
    }

    const uploadedFile = await uploadFileToMediaStorage(file)

    return NextResponse.json({
      url: uploadedFile.url,
      key: uploadedFile.key,
      name: uploadedFile.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    if (error instanceof MediaStorageConfigError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'خطا در آپلود فایل' },
      { status: 500 }
    )
  }
}
