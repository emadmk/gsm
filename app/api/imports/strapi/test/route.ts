import { NextRequest, NextResponse } from 'next/server'
import { inspectStrapiConnection } from '@/lib/imports/strapi-importer'
import {
  strapiConnectionSchema,
  type StrapiConnectionInput,
} from '@/lib/imports/strapi-schemas'
import { resolveStoredStrapiImportConnection } from '@/lib/imports/strapi-settings'
import { requireAuthorizedSession } from '@/lib/api-auth'

export const runtime = 'nodejs'

async function readJsonBody(request: NextRequest) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthorizedSession(request, {
    requiredRole: 'ADMIN',
    enforceSameOrigin: true,
  })
  if (auth.response) {
    return auth.response
  }

  try {
    const body = await readJsonBody(request)
    const hasInlineConnection =
      typeof body === 'object' &&
      body !== null &&
      !Array.isArray(body) &&
      Object.keys(body).length > 0

    let connection: StrapiConnectionInput

    if (hasInlineConnection) {
      const parsed = strapiConnectionSchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          {
            error: 'تنظیمات اتصال نامعتبر است',
            details: parsed.error.flatten(),
          },
          { status: 400 }
        )
      }

      connection = parsed.data
    } else {
      connection = await resolveStoredStrapiImportConnection()
    }

    const result = await inspectStrapiConnection(connection)
    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'اتصال به Strapi برقرار نشد'

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}
