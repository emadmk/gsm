import { NextRequest, NextResponse } from 'next/server'
import { requireAuthorizedSession } from '@/lib/api-auth'
import {
  getStoredMediaStorageConfig,
  buildMediaStoragePublicBaseUrl,
} from '@/lib/media-storage'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthorizedSession(request, {
      requiredRole: 'EDITOR',
    })
    if (auth.response) return auth.response

    const { searchParams } = request.nextUrl
    const prefix = searchParams.get('prefix') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '60')))

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

    const baseUrl = buildMediaStoragePublicBaseUrl(config)

    const folders: { name: string; prefix: string }[] = []
    const files: {
      key: string
      name: string
      size: number
      lastModified: string | null
      url: string
      mimeType: string
    }[] = []

    // Single pass: use Delimiter to get folders and files at this level
    let continuationToken: string | undefined
    let totalFiles = 0
    let skippedFiles = 0
    const startIndex = (page - 1) * limit

    do {
      const command = new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: prefix,
        Delimiter: '/',
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      })

      const response = await client.send(command)

      // Collect folders (only on first page iteration)
      if (response.CommonPrefixes && folders.length === 0) {
        for (const cp of response.CommonPrefixes) {
          if (cp.Prefix) {
            const parts = cp.Prefix.replace(/\/$/, '').split('/')
            folders.push({
              name: parts[parts.length - 1],
              prefix: cp.Prefix,
            })
          }
        }
      }

      // Collect files with pagination
      if (response.Contents) {
        for (const obj of response.Contents) {
          if (!obj.Key || obj.Key === prefix) continue
          totalFiles++

          // Skip files before the current page
          if (skippedFiles < startIndex) {
            skippedFiles++
            continue
          }

          // Only collect up to `limit` files for this page
          if (files.length < limit) {
            const filename = obj.Key.split('/').pop() || obj.Key
            files.push({
              key: obj.Key,
              name: filename,
              size: obj.Size || 0,
              lastModified: obj.LastModified?.toISOString() || null,
              url: baseUrl ? `${baseUrl}/${obj.Key}` : obj.Key,
              mimeType: getMimeType(filename),
            })
          }
        }
      }

      continuationToken = response.NextContinuationToken
    } while (continuationToken)

    return NextResponse.json({
      prefix,
      folders,
      files,
      totalFiles,
      page,
      limit,
      totalPages: Math.ceil(totalFiles / limit),
    })
  } catch (error) {
    console.error('Error browsing media storage:', error)
    return NextResponse.json(
      { error: 'خطا در مرور فضای ذخیره‌سازی' },
      { status: 500 }
    )
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
