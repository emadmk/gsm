import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import prisma from '@/lib/db'
import { generateSeoMeta, generateBreadcrumbSchema, siteConfig } from '@/lib/seo'
import Breadcrumb from '@/components/common/Breadcrumb'
import ArticleCard from '@/components/articles/ArticleCard'
import Pagination from '@/components/common/Pagination'
import { toPersianDigits } from '@/lib/utils'

const ITEMS_PER_PAGE = 10

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await prisma.category.findUnique({ where: { slug } })
  if (!category) return {}

  return generateSeoMeta({
    title: category.seoTitle || category.name,
    description: category.description || `مطالب دسته‌بندی ${category.name}`,
    url: `${siteConfig.url}/category/${slug}`,
  })
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: { orderBy: { order: 'asc' } },
    },
  })

  if (!category) notFound()

  const where = {
    status: 'PUBLISHED' as const,
    categoryId: category.id,
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

  const breadcrumbItems = [
    ...(category.parent
      ? [{ label: category.parent.name, href: `/category/${category.parent.slug}` }]
      : []),
    { label: category.name },
  ]

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'خانه', url: siteConfig.url },
    ...(category.parent
      ? [{ name: category.parent.name, url: `${siteConfig.url}/category/${category.parent.slug}` }]
      : []),
    { name: category.name, url: `${siteConfig.url}/category/${slug}` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="container mx-auto px-4 pb-12" dir="rtl">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mb-6">
          <h1 className="display-sm md:display-lg text-gray-900">{category.name}</h1>
          {category.description && (
            <p className="body-sm text-gray-500 mt-2">{category.description}</p>
          )}
          <span className="body-sm text-gray-400 mt-1 block">
            {toPersianDigits(totalCount)} مطلب
          </span>
        </div>

        {/* Subcategories */}
        {category.children.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            {category.children.map((child) => (
              <a
                key={child.id}
                href={`/category/${child.slug}`}
                className="flex-shrink-0 px-4 py-2 rounded-full body-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                {child.name}
              </a>
            ))}
          </div>
        )}

        {articles.length > 0 ? (
          <div className="space-y-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="body-lg text-gray-400">مطلبی در این دسته‌بندی یافت نشد.</p>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl={`/category/${slug}`}
          />
        )}

        {/* SEO Content */}
        {category.seoContent && (
          <section className="mt-12 bg-gray-50 rounded-xl p-6">
            <div
              className="body-sm text-gray-500 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: category.seoContent }}
            />
          </section>
        )}
      </div>
    </>
  )
}
