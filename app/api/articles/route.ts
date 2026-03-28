import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { requireAuthorizedSession } from '@/lib/api-auth'

const createArticleSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  slug: z.string().min(1, 'اسلاگ الزامی است'),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  image: z.string().optional(),
  imageCaption: z.string().optional(),
  postType: z.enum(['NEWS', 'ARTICLE', 'REVIEW', 'STORY']).default('NEWS'),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  publishedAt: z.string().datetime().optional(),
  authorId: z.number().int().optional(),
  categoryId: z.number().int().optional(),
  tagIds: z.array(z.number().int()).optional(),
  viewCount: z.number().int().optional(),
  readingTime: z.number().int().optional(),
  wordCount: z.number().int().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  canonicalUrl: z.string().optional(),
  focusKeyword: z.string().optional(),
  featured: z.boolean().optional(),
  points: z.any().optional(),
  faq: z.any().optional(),
  brands: z.any().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthorizedSession(request, { requiredRole: 'EDITOR' })
    if (auth.response) {
      return auth.response
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const postType = searchParams.get('postType')
    const status = searchParams.get('status')
    const categoryId = searchParams.get('categoryId')
    const authorId = searchParams.get('authorId')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (postType) {
      where.postType = postType
    }
    if (status) {
      where.status = status
    }
    if (categoryId) {
      where.categoryId = parseInt(categoryId)
    }
    if (authorId) {
      where.authorId = parseInt(authorId)
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          author: true,
          category: true,
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.article.count({ where }),
    ])

    return NextResponse.json({
      articles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت مقالات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthorizedSession(request, {
      requiredRole: 'EDITOR',
      enforceSameOrigin: true,
    })
    if (auth.response) {
      return auth.response
    }

    const body = await request.json()
    const validation = createArticleSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'اطلاعات نامعتبر', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { tagIds, publishedAt, ...data } = validation.data

    const article = await prisma.article.create({
      data: {
        ...data,
        publishedAt: publishedAt ? new Date(publishedAt) : data.status === 'PUBLISHED' ? new Date() : null,
        ...(tagIds && tagIds.length > 0
          ? {
              tags: {
                create: tagIds.map((tagId) => ({ tagId })),
              },
            }
          : {}),
      },
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json(
      { error: 'خطا در ایجاد مقاله' },
      { status: 500 }
    )
  }
}
