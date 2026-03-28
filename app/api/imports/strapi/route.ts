import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/db'
import { strapiImportRequestSchema } from '@/lib/imports/strapi-schemas'
import {
  markStaleStrapiImportsAsFailed,
  startStrapiImportRun,
} from '@/lib/imports/strapi-runner'
import { requireAuthorizedSession } from '@/lib/api-auth'

export const runtime = 'nodejs'

function sanitizeJsonValue(value: unknown): unknown {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  if (value === null) {
    return null
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJsonValue(item)) as Prisma.InputJsonArray
  }

  if (typeof value === 'object' && value) {
    const entries = Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([key, entryValue]) => [key, sanitizeJsonValue(entryValue)])

    return Object.fromEntries(entries) as Prisma.InputJsonObject
  }

  return null
}

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedSession(request, { requiredRole: 'ADMIN' })
  if (auth.response) {
    return auth.response
  }

  const runs = await prisma.importRun.findMany({
    where: { sourceType: 'STRAPI' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      sourceType: true,
      status: true,
      sourceHost: true,
      sourcePort: true,
      sourceDatabase: true,
      sourceUser: true,
      statusMessage: true,
      currentStep: true,
      progressCurrent: true,
      progressTotal: true,
      error: true,
      startedAt: true,
      finishedAt: true,
      createdAt: true,
      updatedAt: true,
      stats: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return NextResponse.json({ runs })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthorizedSession(request, {
    requiredRole: 'ADMIN',
    enforceSameOrigin: true,
  })
  if (auth.response) {
    return auth.response
  }

  const body = await request.json()
  const parsed = strapiImportRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'اطلاعات درون‌ریزی نامعتبر است',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    )
  }

  await markStaleStrapiImportsAsFailed()

  const existingRun = await prisma.importRun.findFirst({
    where: {
      sourceType: 'STRAPI',
      status: 'RUNNING',
    },
    orderBy: { startedAt: 'desc' },
  })

  if (existingRun) {
    return NextResponse.json(
      {
        error: 'یک درون‌ریزی Strapi در حال اجرا است',
        runId: existingRun.id,
      },
      { status: 409 }
    )
  }

  const run = await prisma.importRun.create({
    data: {
      sourceType: 'STRAPI',
      status: 'PENDING',
      sourceHost: parsed.data.connection.host,
      sourcePort: parsed.data.connection.port,
      sourceDatabase: parsed.data.connection.database,
      sourceUser: parsed.data.connection.user,
      statusMessage: 'درون‌ریزی ایجاد شد و در حال شروع است',
      options: sanitizeJsonValue(parsed.data.options) as Prisma.InputJsonValue,
      createdById: (auth.session?.user as { id?: string } | undefined)?.id,
    },
    select: {
      id: true,
      status: true,
      statusMessage: true,
      sourceHost: true,
      sourcePort: true,
      sourceDatabase: true,
      sourceUser: true,
      createdAt: true,
    },
  })

  void startStrapiImportRun({
    runId: run.id,
    connection: parsed.data.connection,
    options: parsed.data.options,
  })

  return NextResponse.json({ run }, { status: 202 })
}
