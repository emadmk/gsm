import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { requireAuthorizedSession } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthorizedSession(request, { requiredRole: 'EDITOR' })
    if (auth.response) {
      return auth.response
    }

    const [
      totalNews,
      totalArticles,
      totalReviews,
      totalStories,
      approvedComments,
      pendingComments,
      totalViews,
      recentArticles,
    ] = await Promise.all([
      prisma.article.count({ where: { postType: 'NEWS' } }),
      prisma.article.count({ where: { postType: 'ARTICLE' } }),
      prisma.article.count({ where: { postType: 'REVIEW' } }),
      prisma.article.count({ where: { postType: 'STORY' } }),
      prisma.comment.count({ where: { isApproved: true } }),
      prisma.comment.count({ where: { isApproved: false } }),
      prisma.article.aggregate({ _sum: { viewCount: true } }),
      prisma.article.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          author: { select: { name: true } },
          category: { select: { name: true } },
        },
      }),
    ])

    return NextResponse.json({
      articles: {
        news: totalNews,
        articles: totalArticles,
        reviews: totalReviews,
        stories: totalStories,
        total: totalNews + totalArticles + totalReviews + totalStories,
      },
      comments: {
        approved: approvedComments,
        pending: pendingComments,
        total: approvedComments + pendingComments,
      },
      totalViews: totalViews._sum.viewCount || 0,
      recentArticles,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت آمار' },
      { status: 500 }
    )
  }
}
