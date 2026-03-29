import crypto from 'node:crypto'

const ENCRYPTED_PREFIX = 'enc:v1'

const sensitiveSettingKeys = new Set([
  's3_access_key',
  's3_secret_key',
  'smtp_password',
  'strapi_import_user',
  'strapi_import_password',
])

function getEncryptionSecret() {
  const secret = process.env.SETTINGS_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET

  if (!secret) {
    throw new Error('SETTINGS_ENCRYPTION_KEY or NEXTAUTH_SECRET is required for sensitive settings')
  }

  return crypto.createHash('sha256').update(secret).digest()
}

export function isSensitiveSettingKey(key: string) {
  return sensitiveSettingKeys.has(key)
}

export function isEncryptedSettingValue(value: string) {
  return value.startsWith(`${ENCRYPTED_PREFIX}:`)
}

export function encryptSettingValue(value: string) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionSecret(), iv)

  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ])

  const tag = cipher.getAuthTag()

  return [
    ENCRYPTED_PREFIX,
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join(':')
}

export function decryptSettingValue(value: string) {
  if (!value.startsWith(`${ENCRYPTED_PREFIX}:`)) {
    return value
  }

  const [, , ivValue, tagValue, encryptedValue] = value.split(':')

  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error('Encrypted setting value is malformed')
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionSecret(),
    Buffer.from(ivValue, 'base64url')
  )
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'))

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

export function serializeSettingValue(key: string, value: string) {
  if (!isSensitiveSettingKey(key) || value === '') {
    return value
  }

  return encryptSettingValue(value)
}

export function deserializeSettingValue(key: string, value: string) {
  if (!isSensitiveSettingKey(key) || value === '') {
    return value
  }

  return decryptSettingValue(value)
}
