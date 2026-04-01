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

// Cancel a running import
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthorizedSession(request, {
    requiredRole: 'ADMIN',
    enforceSameOrigin: true,
  })
  if (auth.response) {
    return auth.response
  }

  const { id } = await context.params
  const body = await request.json()

  if (body.action !== 'cancel') {
    return NextResponse.json({ error: 'عملیات نامعتبر' }, { status: 400 })
  }

  const run = await prisma.importRun.findFirst({
    where: { id, sourceType: 'STRAPI' },
  })

  if (!run) {
    return NextResponse.json({ error: 'درون‌ریزی پیدا نشد' }, { status: 404 })
  }

  if (run.status !== 'RUNNING' && run.status !== 'PENDING') {
    return NextResponse.json({ error: 'این درون‌ریزی قابل لغو نیست' }, { status: 400 })
  }

  await prisma.importRun.update({
    where: { id },
    data: {
      status: 'FAILED',
      statusMessage: 'توسط کاربر لغو شد',
      error: 'Import cancelled by user',
      currentStep: 'cancelled',
      finishedAt: new Date(),
    },
  })

  // Signal cancellation to the runner
  const globalForImports = globalThis as { cancelledStrapiRuns?: Set<string> }
  if (!globalForImports.cancelledStrapiRuns) {
    globalForImports.cancelledStrapiRuns = new Set()
  }
  globalForImports.cancelledStrapiRuns.add(id)

  return NextResponse.json({ success: true, message: 'درون‌ریزی لغو شد' })
}
