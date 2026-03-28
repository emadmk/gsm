import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuthorizedSession } from '@/lib/api-auth'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthorizedSession(request, { requiredRole: 'ADMIN' })
  if (auth.response) {
    return auth.response
  }

  const { id } = await context.params

  const run = await prisma.importRun.findFirst({
    where: {
      id,
      sourceType: 'STRAPI',
    },
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
      logText: true,
      error: true,
      options: true,
      stats: true,
      startedAt: true,
      finishedAt: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!run) {
    return NextResponse.json(
      { error: 'درون‌ریزی موردنظر پیدا نشد' },
      { status: 404 }
    )
  }

  return NextResponse.json({ run })
}
