export type AdminRole = 'ADMIN' | 'EDITOR'

const adminOnlyPagePrefixes = ['/admin/import', '/admin/media', '/admin/settings']
const adminOnlyApiPrefixes = ['/api/imports', '/api/media', '/api/settings']

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin.toLowerCase()
  } catch {
    return value.replace(/\/$/, '').toLowerCase()
  }
}

function buildOrigin(protocol: string, host: string) {
  return normalizeOrigin(`${protocol}://${host.trim()}`)
}

function extractHeaderToken(value?: string | null) {
  return value?.split(',')[0]?.trim() || ''
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

interface TrustedMutationOriginOptions {
  requestOrigin: string
  originHeader?: string | null
  refererHeader?: string | null
  hostHeader?: string | null
  forwardedHostHeader?: string | null
  forwardedProtoHeader?: string | null
}

export function isTrustedMutationOrigin({
  requestOrigin,
  originHeader,
  refererHeader,
  hostHeader,
  forwardedHostHeader,
  forwardedProtoHeader,
}: TrustedMutationOriginOptions) {
  const trustedOrigins = new Set<string>([normalizeOrigin(requestOrigin)])
  const requestProtocol = (() => {
    try {
      return new URL(requestOrigin).protocol.replace(/:$/, '')
    } catch {
      return 'http'
    }
  })()
  const forwardedProto = extractHeaderToken(forwardedProtoHeader) || requestProtocol
  const host = extractHeaderToken(hostHeader)
  const forwardedHost = extractHeaderToken(forwardedHostHeader)

  if (host) {
    trustedOrigins.add(buildOrigin(forwardedProto, host))
    trustedOrigins.add(buildOrigin(requestProtocol, host))
  }

  if (forwardedHost) {
    trustedOrigins.add(buildOrigin(forwardedProto, forwardedHost))
    trustedOrigins.add(buildOrigin(requestProtocol, forwardedHost))
  }

  if (originHeader) {
    return trustedOrigins.has(normalizeOrigin(originHeader))
  }

  if (refererHeader) {
    return trustedOrigins.has(normalizeOrigin(refererHeader))
  }

  return false
}
