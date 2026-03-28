import { getServerSession, type Session } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import {
  hasRequiredRole,
  isTrustedMutationOrigin,
  type AdminRole,
} from '@/lib/admin-security'

interface RequireSessionOptions {
  requiredRole?: AdminRole
  enforceSameOrigin?: boolean
}

type AuthorizedSession = Session

export async function requireAuthorizedSession(
  request: NextRequest,
  options: RequireSessionOptions = {}
): Promise<
  | { session: AuthorizedSession; response?: never }
  | { response: NextResponse; session?: never }
> {
  const {
    requiredRole = 'EDITOR',
    enforceSameOrigin = false,
  } = options

  const session = await getServerSession(authOptions)

  if (!session) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const role = (session.user as { role?: string } | undefined)?.role

  if (!hasRequiredRole(role, requiredRole)) {
    return {
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  if (
    enforceSameOrigin &&
    !isTrustedMutationOrigin(
      request.nextUrl.origin,
      request.headers.get('origin'),
      request.headers.get('referer')
    )
  ) {
    return {
      response: NextResponse.json({ error: 'Invalid origin' }, { status: 403 }),
    }
  }

  return { session }
}
