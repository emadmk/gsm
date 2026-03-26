import { MetadataRoute } from 'next'
import prisma from '@/lib/db'
import { getPostTypeSlug } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gsmblog.gsm.ir'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/news`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${siteUrl}/articles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/reviews`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ]

  // Articles
  let articlePages: MetadataRoute.Sitemap = []
  try {
    const articles = await prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, slug: true, postType: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 50000,
    })
    articlePages = articles.map((article) => ({
      url: `${siteUrl}/mag/${getPostTypeSlug(article.postType)}/${article.id}/${encodeURIComponent(article.slug)}`,
      lastModified: new Date(article.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {
    // DB not ready yet
  }

  // Categories
  let categoryPages: MetadataRoute.Sitemap = []
  try {
    const categories = await prisma.category.findMany({
      select: { slug: true, updatedAt: true },
    })
    categoryPages = categories.map((cat) => ({
      url: `${siteUrl}/category/${cat.slug}`,
      lastModified: new Date(cat.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {
    // DB not ready yet
  }

  // Tags
  let tagPages: MetadataRoute.Sitemap = []
  try {
    const tags = await prisma.tag.findMany({
      select: { slug: true, updatedAt: true },
      take: 5000,
    })
    tagPages = tags.map((tag) => ({
      url: `${siteUrl}/tag/${tag.slug}`,
      lastModified: new Date(tag.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  } catch {
    // DB not ready yet
  }

  // Authors
  let authorPages: MetadataRoute.Sitemap = []
  try {
    const authors = await prisma.author.findMany({
      select: { slug: true, updatedAt: true },
    })
    authorPages = authors.map((author) => ({
      url: `${siteUrl}/author/${author.slug}`,
      lastModified: new Date(author.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))
  } catch {
    // DB not ready yet
  }

  return [...staticPages, ...articlePages, ...categoryPages, ...tagPages, ...authorPages]
}
