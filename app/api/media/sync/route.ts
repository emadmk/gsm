import { NextRequest, NextResponse } from 'next/server'
import { requireAuthorizedSession } from '@/lib/api-auth'
import prisma from '@/lib/db'
import {
  getStoredMediaStorageConfig,
  buildMediaStorageObjectUrl,
  buildMediaStoragePublicBaseUrl,
} from '@/lib/media-storage'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthorizedSession(request, {
      requiredRole: 'ADMIN',
      enforceSameOrigin: true,
    })
    if (auth.response) return auth.response

    const body = await request.json()
    const { prefix = 'media/' } = body

    const config = await getStoredMediaStorageConfig()
    const baseUrl = buildMediaStoragePublicBaseUrl(config)
    const client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: config.pathStyle,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
    })

    let synced = 0
    let skipped = 0
    let continuationToken: string | undefined

    do {
      const command = new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      })

      const response = await client.send(command)
      
      if (response.Contents) {
        for (const obj of response.Contents) {
          if (!obj.Key || obj.Key.endsWith('/')) continue

          const existing = await prisma.media.findFirst({
            where: { path: obj.Key },
          })

          if (existing) {
            skipped++
            continue
          }

          const filename = obj.Key.split('/').pop() || obj.Key
          const mimeType = getMimeType(filename)
          const url = baseUrl ? `${baseUrl}/${obj.Key}` : obj.Key

          await prisma.media.create({
            data: {
              filename,
              originalName: filename,
              mimeType,
              size: obj.Size || 0,
              url,
              path: obj.Key,
            },
          })

          synced++
        }
      }

      continuationToken = response.NextContinuationToken
    } while (continuationToken)

    return NextResponse.json({ synced, skipped, total: synced + skipped })
  } catch (error) {
    console.error('Error syncing media:', error)
    return NextResponse.json({ error: 'خطا در همگام‌سازی رسانه‌ها' }, { status: 500 })
  }
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}
