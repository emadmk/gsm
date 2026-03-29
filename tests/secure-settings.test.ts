import assert from 'node:assert/strict'
import test from 'node:test'
import {
  decryptSettingValue,
  deserializeSettingValue,
  encryptSettingValue,
  isSensitiveSettingKey,
  serializeSettingValue,
} from '../lib/secure-settings'

process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-for-settings'

test('sensitive settings are detected correctly', () => {
  assert.equal(isSensitiveSettingKey('s3_secret_key'), true)
  assert.equal(isSensitiveSettingKey('smtp_password'), true)
  assert.equal(isSensitiveSettingKey('strapi_import_password'), true)
  assert.equal(isSensitiveSettingKey('strapi_import_user'), true)
  assert.equal(isSensitiveSettingKey('site_title'), false)
})

test('encryptSettingValue and decryptSettingValue round-trip values', () => {
  const encrypted = encryptSettingValue('super-secret')
  assert.notEqual(encrypted, 'super-secret')
  assert.match(encrypted, /^enc:v1:/)
  assert.equal(decryptSettingValue(encrypted), 'super-secret')
})

test('serializeSettingValue only encrypts sensitive keys', () => {
  const encrypted = serializeSettingValue('s3_secret_key', 'abc123')
  assert.match(encrypted, /^enc:v1:/)

  const plain = serializeSettingValue('site_title', 'GSM')
  assert.equal(plain, 'GSM')
})

test('deserializeSettingValue supports encrypted and legacy plain text values', () => {
  const encrypted = serializeSettingValue('smtp_password', 'mail-secret')
  assert.equal(deserializeSettingValue('smtp_password', encrypted), 'mail-secret')
  assert.equal(deserializeSettingValue('smtp_password', 'legacy-plain-text'), 'legacy-plain-text')
})
