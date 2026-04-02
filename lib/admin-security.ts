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

function getTrustedOrigins(): string[] {
  const origins: string[] = []
  const nextAuthUrl = process.env.NEXTAUTH_URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (nextAuthUrl) origins.push(normalizeOrigin(nextAuthUrl))
  if (siteUrl) origins.push(normalizeOrigin(siteUrl))
  return origins
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

    // When behind a reverse proxy, request.nextUrl.origin may be 127.0.0.1:3000
    // while the browser sends the public IP. Check against configured trusted origins.
    const trusted = getTrustedOrigins()
    if (trusted.includes(normalizedOrigin)) return true

    return false
  }

  if (refererHeader) {
    const normalizedReferer = normalizeOrigin(refererHeader)
    if (normalizedReferer.startsWith(normalizedRequestOrigin)) return true

    const trusted = getTrustedOrigins()
    return trusted.some((t) => normalizedReferer.startsWith(t))
  }

  return false
}
