export type AdminRole = 'ADMIN' | 'EDITOR'

const adminOnlyPagePrefixes = ['/admin/import', '/admin/media', '/admin/settings']
const adminOnlyApiPrefixes = ['/api/imports', '/api/media', '/api/settings']

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
    const normalizedOrigin = normalizeOrigin(originHeader)
    // Allow both exact match and localhost/IP variations
    if (normalizedOrigin === normalizedRequestOrigin) return true
    
    // Extract hostname without protocol for IP/localhost comparison
    try {
      const reqUrl = new URL(normalizedRequestOrigin)
      const originUrl = new URL(normalizedOrigin)
      return reqUrl.hostname === originUrl.hostname && reqUrl.port === originUrl.port
    } catch {
      return false
    }
  }

  if (refererHeader) {
    return normalizeOrigin(refererHeader).startsWith(normalizedRequestOrigin)
  }

  return false
}
