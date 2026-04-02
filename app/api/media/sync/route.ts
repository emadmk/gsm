import { NextRequest, NextResponse } from 'next/server'
import { requireAuthorizedSession } from '@/lib/api-auth'
import prisma from '@/lib/db'
import {
  getStoredMediaStorageConfig,
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
    let duplicatesRemoved = 0
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

          const filename = obj.Key.split('/').pop() || obj.Key
          const mimeType = getMimeType(filename)
          const url = baseUrl ? `${baseUrl}/${obj.Key}` : obj.Key

          const existing = await prisma.media.findFirst({
            where: { path: obj.Key },
          })

          if (existing) {
            await prisma.media.update({
              where: { id: existing.id },
              data: { filename, originalName: filename, mimeType, size: obj.Size || 0, url },
            })
            skipped++
          } else {
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
      }

      continuationToken = response.NextContinuationToken
    } while (continuationToken)

    // Clean up duplicates: keep only the latest record per path
    const duplicates = await prisma.$queryRaw<{ path: string; cnt: bigint }[]>`
      SELECT path, COUNT(*) as cnt FROM "Media" GROUP BY path HAVING COUNT(*) > 1
    `

    for (const dup of duplicates) {
      const records = await prisma.media.findMany({
        where: { path: dup.path },
        orderBy: { id: 'desc' },
      })
      if (records.length > 1) {
        const idsToDelete = records.slice(1).map((r) => r.id)
        await prisma.media.deleteMany({ where: { id: { in: idsToDelete } } })
        duplicatesRemoved += idsToDelete.length
      }
    }

    return NextResponse.json({ synced, skipped, duplicatesRemoved, total: synced + skipped })
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
