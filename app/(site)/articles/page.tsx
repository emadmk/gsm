import { Metadata } from 'next'
import Link from 'next/link'
import prisma from '@/lib/db'
import { generateSeoMeta, generateBreadcrumbSchema, siteConfig } from '@/lib/seo'
import Breadcrumb from '@/components/common/Breadcrumb'
import ArticleCard from '@/components/articles/ArticleCard'
import Pagination from '@/components/common/Pagination'

const ITEMS_PER_PAGE = 10

interface PageProps {
  searchParams: Promise<{ page?: string; brand?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoMeta({
    title: 'مقالات',
    description: 'مقالات تخصصی موبایل و تکنولوژی',
    url: `${siteConfig.url}/articles`,
  })
}

export default async function ArticlesListPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const brand = params.brand || undefined

  const where = {
    status: 'PUBLISHED' as const,
    postType: 'ARTICLE' as const,
  }

  const [articles, totalCount, categories] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      include: { author: true, category: true },
    }),
    prisma.article.count({ where }),
    prisma.category.findMany({
      where: {
        articles: { some: { status: 'PUBLISHED', postType: 'ARTICLE' } },
      },
      orderBy: { name: 'asc' },
      take: 20,
    }),
  ])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'خانه', url: siteConfig.url },
    { name: 'مقالات', url: `${siteConfig.url}/articles` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="container mx-auto px-4 pb-12" dir="rtl">
        <Breadcrumb items={[{ label: 'مقالات' }]} />

        <h1 className="display-sm md:display-lg text-gray-900 mb-6">مقالات</h1>

        {/* Category Filter Chips */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            <Link
              href="/articles"
              className={`flex-shrink-0 px-4 py-2 rounded-full body-sm transition-colors ${
                !brand
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              همه
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/articles?brand=${cat.slug}`}
                className={`flex-shrink-0 px-4 py-2 rounded-full body-sm transition-colors ${
                  brand === cat.slug
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Articles List */}
          <div className="lg:col-span-2">
            {articles.length > 0 ? (
              <div className="space-y-4">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="body-lg text-gray-400">مطلبی یافت نشد.</p>
              </div>
            )}

            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                baseUrl="/articles"
              />
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              <div className="bg-gray-50 rounded-xl p-4 text-center min-h-[250px] flex-center">
                <span className="body-sm text-gray-300">تبلیغات</span>
              </div>
            </div>
          </aside>
        </div>

        {/* SEO Content Box */}
        <section className="mt-12 bg-gray-50 rounded-xl p-6">
          <h2 className="h2 text-gray-900 mb-3">مقالات تخصصی موبایل و تکنولوژی</h2>
          <p className="body-sm text-gray-500 leading-relaxed">
            در بخش مقالات جی‌اس‌ام، مقالات تخصصی و آموزشی در حوزه موبایل، تبلت و تکنولوژی
            را مطالعه کنید. از راهنمای خرید گرفته تا مقایسه محصولات و آموزش‌های کاربردی.
          </p>
        </section>
      </div>
    </>
  )
}
