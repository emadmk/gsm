import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { requireAuthorizedSession } from '@/lib/api-auth'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
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

    // Create upload directory if it doesn't exist
    const now = new Date()
    const yearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`
    const uploadPath = path.join(UPLOAD_DIR, yearMonth)
    await mkdir(uploadPath, { recursive: true })

    // Generate unique filename
    const ext = path.extname(file.name) || '.jpg'
    const baseName = path
      .basename(file.name, ext)
      .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_')
      .substring(0, 100)
    const uniqueName = `${baseName}-${Date.now()}${ext}`
    const filePath = path.join(uploadPath, uniqueName)

    // Write file
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    const publicPath = `/uploads/${yearMonth}/${uniqueName}`

    return NextResponse.json({
      url: publicPath,
      name: uniqueName,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'خطا در آپلود فایل' },
      { status: 500 }
    )
  }
}
