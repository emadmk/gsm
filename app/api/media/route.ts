import { NextRequest, NextResponse } from 'next/server'
import { requireAuthorizedSession } from '@/lib/api-auth'
import prisma from '@/lib/db'
import {
  MediaStorageConfigError,
  uploadFileToMediaStorage,
  getStoredMediaStorageConfig,
  buildMediaStorageObjectUrl,
} from '@/lib/media-storage'
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/ogg',
]
const MAX_SIZE = 50 * 1024 * 1024 // 50MB

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthorizedSession(request, {
      requiredRole: 'EDITOR',
    })
    if (auth.response) return auth.response

    const { searchParams } = request.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '40')))
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || 'all'
    const sort = searchParams.get('sort') || 'date-desc'

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { altText: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (type === 'images') {
      where.mimeType = { startsWith: 'image/' }
    } else if (type === 'videos') {
      where.mimeType = { startsWith: 'video/' }
    }

    let orderBy: Record<string, string> = { createdAt: 'desc' }
    switch (sort) {
      case 'date-asc':
        orderBy = { createdAt: 'asc' }
        break
      case 'name-asc':
        orderBy = { originalName: 'asc' }
        break
      case 'name-desc':
        orderBy = { originalName: 'desc' }
        break
      case 'size-asc':
        orderBy = { size: 'asc' }
        break
      case 'size-desc':
        orderBy = { size: 'desc' }
        break
      default:
        orderBy = { createdAt: 'desc' }
    }

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.media.count({ where }),
    ])

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت رسانه‌ها' },
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
    if (auth.response) return auth.response

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'فایلی انتخاب نشده' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'فرمت فایل مجاز نیست' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'حجم فایل نباید بیشتر از ۵۰ مگابایت باشد' },
        { status: 400 }
      )
    }

    const uploaded = await uploadFileToMediaStorage(file)

    // Try to get dimensions for images
    let width: number | null = null
    let height: number | null = null

    const media = await prisma.media.create({
      data: {
        filename: uploaded.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        width,
        height,
        url: uploaded.url,
        path: uploaded.key,
      },
    })

    return NextResponse.json(media)
  } catch (error) {
    if (error instanceof MediaStorageConfigError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Error uploading media:', error)
    return NextResponse.json({ error: 'خطا در آپلود فایل' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuthorizedSession(request, {
      requiredRole: 'EDITOR',
      enforceSameOrigin: true,
    })
    if (auth.response) return auth.response

    const body = await request.json()
    const { id, filename, altText } = body

    if (!id) {
      return NextResponse.json({ error: 'شناسه رسانه الزامی است' }, { status: 400 })
    }

    const existing = await prisma.media.findUnique({ where: { id: Number(id) } })
    if (!existing) {
      return NextResponse.json({ error: 'رسانه یافت نشد' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (typeof filename === 'string') data.filename = filename
    if (typeof altText === 'string') data.altText = altText

    const updated = await prisma.media.update({
      where: { id: Number(id) },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating media:', error)
    return NextResponse.json({ error: 'خطا در بروزرسانی رسانه' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuthorizedSession(request, {
      requiredRole: 'EDITOR',
      enforceSameOrigin: true,
    })
    if (auth.response) return auth.response

    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'شناسه رسانه‌ها الزامی است' }, { status: 400 })
    }

    const mediaItems = await prisma.media.findMany({
      where: { id: { in: ids.map(Number) } },
    })

    if (mediaItems.length === 0) {
      return NextResponse.json({ error: 'رسانه‌ای یافت نشد' }, { status: 404 })
    }

    // Delete from S3
    try {
      const config = await getStoredMediaStorageConfig()
      const client = new S3Client({
        region: config.region,
        endpoint: config.endpoint,
        forcePathStyle: config.pathStyle,
        credentials: {
          accessKeyId: config.accessKey,
          secretAccessKey: config.secretKey,
        },
      })

      await Promise.allSettled(
        mediaItems.map((item) =>
          client.send(
            new DeleteObjectCommand({
              Bucket: config.bucket,
              Key: item.path,
            })
          )
        )
      )
    } catch (s3Error) {
      console.error('Error deleting from S3 (continuing with DB cleanup):', s3Error)
    }

    // Delete from database
    await prisma.media.deleteMany({
      where: { id: { in: ids.map(Number) } },
    })

    return NextResponse.json({ deleted: ids.length })
  } catch (error) {
    console.error('Error deleting media:', error)
    return NextResponse.json({ error: 'خطا در حذف رسانه' }, { status: 500 })
  }
}
