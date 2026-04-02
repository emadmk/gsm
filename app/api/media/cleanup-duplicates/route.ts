import { NextRequest, NextResponse } from 'next/server'
import { requireAuthorizedSession } from '@/lib/api-auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedSession(request, { requiredRole: 'ADMIN' })
  if (auth.response) return auth.response

  const duplicates = await prisma.$queryRaw<{ path: string; cnt: bigint }[]>`
    SELECT path, COUNT(*) as cnt FROM "Media" GROUP BY path HAVING COUNT(*) > 1
  `

  const totalDuplicates = duplicates.reduce((sum, d) => sum + (Number(d.cnt) - 1), 0)

  return NextResponse.json({
    duplicateGroups: duplicates.length,
    totalDuplicateRecords: totalDuplicates,
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthorizedSession(request, { requiredRole: 'ADMIN' })
  if (auth.response) return auth.response

  const duplicates = await prisma.$queryRaw<{ path: string; cnt: bigint }[]>`
    SELECT path, COUNT(*) as cnt FROM "Media" GROUP BY path HAVING COUNT(*) > 1
  `

  let removed = 0

  for (const dup of duplicates) {
    const records = await prisma.media.findMany({
      where: { path: dup.path },
      orderBy: { id: 'desc' },
    })
    if (records.length > 1) {
      const idsToDelete = records.slice(1).map((r) => r.id)
      await prisma.media.deleteMany({ where: { id: { in: idsToDelete } } })
      removed += idsToDelete.length
    }
  }

  return NextResponse.json({
    success: true,
    removed,
    message: `${removed} رکورد تکراری حذف شد`,
  })
}
