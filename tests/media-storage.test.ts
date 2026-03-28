import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildMediaStorageObjectUrl,
  buildMediaStoragePublicBaseUrl,
  buildUploadObjectKey,
  normalizeMediaStorageConfig,
  sanitizeUploadFileName,
} from '@/lib/media-storage'

test('normalizeMediaStorageConfig converts string pathStyle and trims urls', () => {
  const config = normalizeMediaStorageConfig({
    endpoint: 'https://s3.gsm.ir/',
    cdnUrl: 'https://s3.gsm.ir/gsmblog-production/',
    pathStyle: 'true',
  })

  assert.equal(config.endpoint, 'https://s3.gsm.ir')
  assert.equal(config.cdnUrl, 'https://s3.gsm.ir/gsmblog-production')
  assert.equal(config.pathStyle, true)
  assert.equal(config.region, 'us-east-1')
})

test('buildMediaStoragePublicBaseUrl prefers custom domain', () => {
  const url = buildMediaStoragePublicBaseUrl(
    normalizeMediaStorageConfig({
      endpoint: 'https://s3.gsm.ir',
      bucket: 'gsmblog-production',
      cdnUrl: 'https://cdn.gsm.ir/media',
      pathStyle: 'true',
    })
  )

  assert.equal(url, 'https://cdn.gsm.ir/media')
})

test('buildMediaStoragePublicBaseUrl supports path-style endpoints', () => {
  const url = buildMediaStoragePublicBaseUrl(
    normalizeMediaStorageConfig({
      endpoint: 'https://s3.gsm.ir',
      bucket: 'gsmblog-production',
      pathStyle: 'true',
    })
  )

  assert.equal(url, 'https://s3.gsm.ir/gsmblog-production')
})

test('buildMediaStorageObjectUrl appends object key to configured base url', () => {
  const url = buildMediaStorageObjectUrl(
    normalizeMediaStorageConfig({
      endpoint: 'https://s3.gsm.ir',
      bucket: 'gsmblog-production',
      pathStyle: 'true',
    }),
    'uploads/2026/03/example-file.jpg'
  )

  assert.equal(
    url,
    'https://s3.gsm.ir/gsmblog-production/uploads/2026/03/example-file.jpg'
  )
})

test('sanitizeUploadFileName keeps readable safe names', () => {
  const fileName = sanitizeUploadFileName('Screenshot 2026/03?.PNG', 'image/png')

  assert.equal(fileName.extension, '.png')
  assert.equal(fileName.baseName, 'Screenshot-2026-03')
})

test('buildUploadObjectKey generates unique upload path with year and month folders', () => {
  const objectKey = buildUploadObjectKey('My Story Cover.png', {
    mimeType: 'image/png',
    now: new Date('2026-03-28T10:00:00.000Z'),
  })

  assert.match(
    objectKey,
    /^uploads\/2026\/03\/My-Story-Cover-1774692000000-[a-f0-9]{8}\.png$/
  )
})
