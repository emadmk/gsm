import assert from 'node:assert/strict'
import test from 'node:test'
import {
  hasRequiredRole,
  isAdminOnlyApiPath,
  isAdminOnlyPagePath,
  isTrustedMutationOrigin,
} from '../lib/admin-security'

test('ADMIN satisfies both admin and editor requirements', () => {
  assert.equal(hasRequiredRole('ADMIN', 'ADMIN'), true)
  assert.equal(hasRequiredRole('ADMIN', 'EDITOR'), true)
})

test('EDITOR cannot access admin-only requirement', () => {
  assert.equal(hasRequiredRole('EDITOR', 'EDITOR'), true)
  assert.equal(hasRequiredRole('EDITOR', 'ADMIN'), false)
  assert.equal(hasRequiredRole(undefined, 'EDITOR'), false)
})

test('admin-only page detection matches expected sections', () => {
  assert.equal(isAdminOnlyPagePath('/admin/import/strapi'), true)
  assert.equal(isAdminOnlyPagePath('/admin/settings'), true)
  assert.equal(isAdminOnlyPagePath('/admin/media'), true)
  assert.equal(isAdminOnlyPagePath('/admin/articles'), false)
})

test('admin-only api detection matches expected endpoints', () => {
  assert.equal(isAdminOnlyApiPath('/api/imports/strapi'), true)
  assert.equal(isAdminOnlyApiPath('/api/imports/strapi/test'), true)
  assert.equal(isAdminOnlyApiPath('/api/settings'), true)
  assert.equal(isAdminOnlyApiPath('/api/articles'), false)
})

test('trusted mutation origin accepts matching origin header', () => {
  assert.equal(
    isTrustedMutationOrigin(
      'https://admin.example.com',
      'https://admin.example.com',
      null
    ),
    true
  )
})

test('trusted mutation origin accepts referer fallback from same origin', () => {
  assert.equal(
    isTrustedMutationOrigin(
      'https://admin.example.com',
      null,
      'https://admin.example.com/admin/articles'
    ),
    true
  )
})

test('trusted mutation origin rejects cross-origin requests', () => {
  assert.equal(
    isTrustedMutationOrigin(
      'https://admin.example.com',
      'https://evil.example.com',
      null
    ),
    false
  )

  assert.equal(
    isTrustedMutationOrigin(
      'https://admin.example.com',
      null,
      'https://evil.example.com/attack'
    ),
    false
  )
})

test('trusted mutation origin rejects missing origin and referer', () => {
  assert.equal(
    isTrustedMutationOrigin('https://admin.example.com', null, null),
    false
  )
})
