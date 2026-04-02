import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuthorizedSession } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const maxDuration = 300

const URL_RULES = [
  { from: '/mag/article/', to: '/mag/articles/' },
  { from: '/mag/review/', to: '/mag/reviews/' },
]

const TEXT_FIELDS = ['content', 'excerpt', 'metaDesc', 'canonicalUrl', 'oldUrl'] as const

function replaceAll(text: string): string {
  let result = text
  for (const rule of URL_RULES) {
    result = result.split(rule.from).join(rule.to)
  }
  return result
}

function hasOldUrl(text: string): boolean {
  return URL_RULES.some((rule) => text.includes(rule.from))
}

export async function GET(request: NextRequest) {
  const auth = await requireAuthorizedSession(request, { requiredRole: 'ADMIN' })
  if (auth.response) return auth.response

  const conditions = []
  for (const rule of URL_RULES) {
    for (const field of TEXT_FIELDS) {
      conditions.push({ [field]: { contains: rule.from } })
    }
  }

  const totalMatches = await prisma.article.count({
    where: { OR: conditions },
  })

  return NextResponse.json({
    totalArticlesWithOldUrls: totalMatches,
    rules: URL_RULES,
    fields: TEXT_FIELDS,
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthorizedSession(request, { requiredRole: 'ADMIN' })
  if (auth.response) return auth.response

  const conditions = []
  for (const rule of URL_RULES) {
    for (const field of TEXT_FIELDS) {
      conditions.push({ [field]: { contains: rule.from } })
    }
  }

  let updatedArticles = 0
  const BATCH_SIZE = 200

  let hasMore = true
  while (hasMore) {
    const articles = await prisma.article.findMany({
      where: { OR: conditions },
      select: { id: true, content: true, excerpt: true, metaDesc: true, canonicalUrl: true, oldUrl: true },
      take: BATCH_SIZE,
    })

    if (articles.length === 0) {
      hasMore = false
      break
    }

    for (const article of articles) {
      const data: Record<string, string> = {}

      if (article.content && hasOldUrl(article.content)) {
        data.content = replaceAll(article.content)
      }
      if (article.excerpt && hasOldUrl(article.excerpt)) {
        data.excerpt = replaceAll(article.excerpt)
      }
      if (article.metaDesc && hasOldUrl(article.metaDesc)) {
        data.metaDesc = replaceAll(article.metaDesc)
      }
      if (article.canonicalUrl && hasOldUrl(article.canonicalUrl)) {
        data.canonicalUrl = replaceAll(article.canonicalUrl)
      }
      if (article.oldUrl && hasOldUrl(article.oldUrl)) {
        data.oldUrl = replaceAll(article.oldUrl)
      }

      if (Object.keys(data).length > 0) {
        await prisma.article.update({
          where: { id: article.id },
          data,
        })
        updatedArticles++
      }
    }
  }

  return NextResponse.json({
    success: true,
    updatedArticles,
    message: `لینک‌های داخلی ${updatedArticles} مطلب بروزرسانی شد`,
  })
}
