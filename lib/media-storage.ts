import crypto from 'node:crypto'
import path from 'node:path'
import {
  DeleteObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { deserializeSettingValue } from '@/lib/secure-settings'

const MEDIA_STORAGE_SETTING_KEYS = [
  's3_provider',
  's3_endpoint',
  's3_access_key',
  's3_secret_key',
  's3_region',
  's3_bucket',
  's3_cdn_url',
  's3_path_style',
] as const

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
}

export interface MediaStorageConfig {
  provider: string
  endpoint: string
  accessKey: string
  secretKey: string
  region: string
  bucket: string
  cdnUrl: string
  pathStyle: boolean
}

type MediaStorageConfigInput = Omit<Partial<MediaStorageConfig>, 'pathStyle'> & {
  pathStyle?: boolean | string
}

export class MediaStorageConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MediaStorageConfigError'
  }
}

function trimTrailingSlashes(value: string) {
  return value.trim().replace(/\/+$/, '')
}

function trimLeadingSlashes(value: string) {
  return value.replace(/^\/+/, '')
}

export function normalizeMediaStorageConfig(
  input: MediaStorageConfigInput
): MediaStorageConfig {
  return {
    provider: input.provider?.trim() || 'S3-Compatible Storage',
    endpoint: trimTrailingSlashes(input.endpoint || ''),
    accessKey: input.accessKey?.trim() || '',
    secretKey: input.secretKey?.trim() || '',
    region: input.region?.trim() || 'us-east-1',
    bucket: input.bucket?.trim() || '',
    cdnUrl: trimTrailingSlashes(input.cdnUrl || ''),
    pathStyle: input.pathStyle === true || input.pathStyle === 'true',
  }
}

export function mapSettingsPayloadToMediaStorageConfig(payload: Record<string, unknown>) {
  return normalizeMediaStorageConfig({
    provider: String(payload.s3_provider || ''),
    endpoint: String(payload.s3_endpoint || ''),
    accessKey: String(payload.s3_access_key || ''),
    secretKey: String(payload.s3_secret_key || ''),
    region: String(payload.s3_region || ''),
    bucket: String(payload.s3_bucket || ''),
    cdnUrl: String(payload.s3_cdn_url || ''),
    pathStyle: payload.s3_path_style === true || payload.s3_path_style === 'true',
  })
}

export function validateMediaStorageConfig(config: MediaStorageConfig) {
  const missing: string[] = []

  if (!config.endpoint) missing.push('S3 Endpoint URL')
  if (!config.accessKey) missing.push('Access Key ID')
  if (!config.secretKey) missing.push('Secret Access Key')
  if (!config.bucket) missing.push('Bucket Name')

  return missing
}

export function buildMediaStoragePublicBaseUrl(config: MediaStorageConfig) {
  if (config.cdnUrl) {
    return trimTrailingSlashes(config.cdnUrl)
  }

  if (!config.endpoint || !config.bucket) {
    return ''
  }

  const endpoint = new URL(config.endpoint)
  const endpointPath = endpoint.pathname.replace(/\/+$/, '')

  if (config.pathStyle || endpointPath) {
    return `${endpoint.origin}${endpointPath}/${config.bucket}`
  }

  return `${endpoint.protocol}//${config.bucket}.${endpoint.host}`
}

export function buildMediaStorageObjectUrl(config: MediaStorageConfig, objectKey: string) {
  const baseUrl = buildMediaStoragePublicBaseUrl(config)

  if (!baseUrl) {
    return objectKey
  }

  return `${baseUrl}/${trimLeadingSlashes(objectKey)}`
}

export function sanitizeUploadFileName(fileName: string, mimeType?: string) {
  const normalizedName = fileName.normalize('NFKC').replace(/[\\/]+/g, '-')
  const rawExtensionMatch = normalizedName.match(/(\.[a-z0-9]+)$/i)
  const rawExtension = rawExtensionMatch ? rawExtensionMatch[1].toLowerCase() : ''
  const extension =
    (rawExtension && /^[.a-z0-9]+$/.test(rawExtension) ? rawExtension : '') ||
    MIME_EXTENSION_MAP[mimeType || ''] ||
    '.bin'

  const fileNameWithoutExtension = rawExtension
    ? normalizedName.slice(0, -rawExtension.length)
    : normalizedName

  const baseName =
    fileNameWithoutExtension
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}_-]+/gu, '-')
      .replace(/-+/g, '-')
      .replace(/^[-_]+|[-_]+$/g, '')
      .slice(0, 80) || 'file'

  return {
    baseName,
    extension,
  }
}

export function buildUploadObjectKey(
  fileName: string,
  options?: { mimeType?: string; now?: Date }
) {
  const now = options?.now || new Date()
  const { baseName, extension } = sanitizeUploadFileName(fileName, options?.mimeType)
  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const uniqueSuffix = `${now.getTime()}-${crypto.randomBytes(4).toString('hex')}`

  return `uploads/${year}/${month}/${baseName}-${uniqueSuffix}${extension}`
}

function createMediaStorageClient(config: MediaStorageConfig) {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.pathStyle,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
  })
}

export async function getStoredMediaStorageConfig() {
  const { default: prisma } = await import('@/lib/db')

  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [...MEDIA_STORAGE_SETTING_KEYS],
      },
    },
  })

  const settingsMap = new Map<string, string>()

  for (const setting of settings) {
    settingsMap.set(
      setting.key,
      deserializeSettingValue(setting.key, setting.value)
    )
  }

  return normalizeMediaStorageConfig({
    provider: settingsMap.get('s3_provider') || process.env.S3_PROVIDER || '',
    endpoint: settingsMap.get('s3_endpoint') || process.env.S3_ENDPOINT || '',
    accessKey: settingsMap.get('s3_access_key') || process.env.S3_ACCESS_KEY || '',
    secretKey: settingsMap.get('s3_secret_key') || process.env.S3_SECRET_KEY || '',
    region: settingsMap.get('s3_region') || process.env.S3_REGION || 'us-east-1',
    bucket: settingsMap.get('s3_bucket') || process.env.S3_BUCKET || '',
    cdnUrl:
      settingsMap.get('s3_cdn_url') ||
      process.env.NEXT_PUBLIC_S3_BASE_URL ||
      process.env.S3_BASE_URL ||
      '',
    pathStyle: settingsMap.get('s3_path_style') || process.env.S3_PATH_STYLE || 'false',
  })
}

export async function uploadFileToMediaStorage(file: File) {
  const config = await getStoredMediaStorageConfig()
  const missing = validateMediaStorageConfig(config)

  if (missing.length > 0) {
    throw new MediaStorageConfigError(
      `تنظیمات فضای ذخیره‌سازی ناقص است: ${missing.join('، ')}`
    )
  }

  const objectKey = buildUploadObjectKey(file.name, {
    mimeType: file.type,
  })

  const body = Buffer.from(await file.arrayBuffer())
  const client = createMediaStorageClient(config)

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
      Body: body,
      ContentType: file.type || undefined,
      CacheControl: 'public, max-age=31536000',
    })
  )

  return {
    key: objectKey,
    name: path.posix.basename(objectKey),
    url: buildMediaStorageObjectUrl(config, objectKey),
  }
}

export async function testMediaStorageConnection(configInput: MediaStorageConfig) {
  const config = normalizeMediaStorageConfig(configInput)
  const missing = validateMediaStorageConfig(config)

  if (missing.length > 0) {
    throw new MediaStorageConfigError(
      `برای تست اتصال این مقدارها لازم است: ${missing.join('، ')}`
    )
  }

  const client = createMediaStorageClient(config)

  await client.send(
    new HeadBucketCommand({
      Bucket: config.bucket,
    })
  )

  const probeKey = `_gsm/connection-tests/${Date.now()}-${crypto.randomUUID()}.txt`

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: probeKey,
      Body: Buffer.from('gsm storage connection test', 'utf8'),
      ContentType: 'text/plain; charset=utf-8',
    })
  )

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: probeKey,
      })
    )
  } catch (error) {
    console.warn('Media storage probe cleanup failed:', error)
  }

  return {
    bucket: config.bucket,
    endpoint: config.endpoint,
    publicBaseUrl: buildMediaStoragePublicBaseUrl(config),
    pathStyle: config.pathStyle,
  }
}
