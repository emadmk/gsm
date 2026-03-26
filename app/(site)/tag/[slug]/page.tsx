import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import prisma from '@/lib/db'
import { generateSeoMeta, generateBreadcrumbSchema, siteConfig } from '@/lib/seo'
import Breadcrumb from '@/components/common/Breadcrumb'
import ArticleCard from '@/components/articles/ArticleCard'
import Pagination from '@/components/common/Pagination'
import { toPersianDigits } from '@/lib/utils'
import { Tag } from 'lucide-react'

const ITEMS_PER_PAGE = 10

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const tag = await prisma.tag.findUnique({ where: { slug } })
  if (!tag) return {}

  return generateSeoMeta({
    title: tag.name,
    description: `مطالب مرتبط با ${tag.name}`,
    url: `${siteConfig.url}/tag/${slug}`,
  })
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)

  const tag = await prisma.tag.findUnique({ where: { slug } })
  if (!tag) notFound()

  const where = {
    status: 'PUBLISHED' as const,
    tags: { some: { tagId: tag.id } },
  }

  const [articles, totalCount] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      include: { author: true, category: true },
    }),
    prisma.article.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'خانه', url: siteConfig.url },
    { name: tag.name, url: `${siteConfig.url}/tag/${slug}` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="container mx-auto px-4 pb-12" dir="rtl">
        <Breadcrumb items={[{ label: tag.name }]} />

        <div className="mb-6 flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary-500/[0.08] flex-center">
            <Tag className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <h1 className="display-sm md:display-lg text-gray-900">{tag.name}</h1>
            <span className="body-sm text-gray-400">
              {toPersianDigits(totalCount)} مطلب
            </span>
          </div>
        </div>

        {articles.length > 0 ? (
          <div className="space-y-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="body-lg text-gray-400">مطلبی با این برچسب یافت نشد.</p>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl={`/tag/${slug}`}
          />
        )}
      </div>
    </>
  )
}
