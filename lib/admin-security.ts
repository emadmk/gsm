export type AdminRole = 'ADMIN' | 'EDITOR'

const adminOnlyPagePrefixes = ['/admin/import', '/admin/media', '/admin/settings']
const adminOnlyApiPrefixes = ['/api/imports', '/api/settings']

function normalizeOrigin(value: string) {
  return value.replace(/\/$/, '').toLowerCase()
}

export function hasRequiredRole(
  role: string | null | undefined,
  requiredRole: AdminRole
) {
  if (role === 'ADMIN') {
    return true
  }

  if (requiredRole === 'EDITOR' && role === 'EDITOR') {
    return true
  }

  return false
}

export function isAdminOnlyPagePath(pathname: string) {
  return adminOnlyPagePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function isAdminOnlyApiPath(pathname: string) {
  return adminOnlyApiPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function isTrustedMutationOrigin(
  requestOrigin: string,
  originHeader?: string | null,
  refererHeader?: string | null
) {
  const normalizedRequestOrigin = normalizeOrigin(requestOrigin)

  if (originHeader) {
    return normalizeOrigin(originHeader) === normalizedRequestOrigin
  }

  if (refererHeader) {
    return normalizeOrigin(refererHeader).startsWith(normalizedRequestOrigin)
  }

  return false
}
