import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const postType = searchParams.get('postType')

    if (!q || q.trim().length === 0) {
      return NextResponse.json(
        { error: 'عبارت جستجو الزامی است' },
        { status: 400 }
      )
    }

    const searchTerm = q.trim()

    const where: Record<string, unknown> = {
      status: 'PUBLISHED',
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { excerpt: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
      ],
    }

    if (postType) {
      where.postType = postType
    }

    const articles = await prisma.article.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        image: true,
        postType: true,
        publishedAt: true,
        author: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    })

    // Add simple highlight info
    const results = articles.map((article) => {
      const titleMatch = article.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
      const excerptMatch = article.excerpt
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())

      return {
        ...article,
        highlights: {
          title: titleMatch || false,
          excerpt: excerptMatch || false,
        },
      }
    })

    return NextResponse.json({
      query: searchTerm,
      total: results.length,
      results,
    })
  } catch (error) {
    console.error('Error searching articles:', error)
    return NextResponse.json(
      { error: 'خطا در جستجو' },
      { status: 500 }
    )
  }
}
