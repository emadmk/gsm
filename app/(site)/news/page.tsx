import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/db'
import { generateSeoMeta, generateBreadcrumbSchema, siteConfig } from '@/lib/seo'
import {
  getPostUrl,
  formatDateShort,
  getImageUrl,
  toPersianDigits,
} from '@/lib/utils'
import Breadcrumb from '@/components/common/Breadcrumb'
import ArticleCard from '@/components/articles/ArticleCard'
import Pagination from '@/components/common/Pagination'
import { Clock, User } from 'lucide-react'

const ITEMS_PER_PAGE = 12

interface PageProps {
  searchParams: Promise<{ page?: string; brand?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoMeta({
    title: 'اخبار',
    description: 'آخرین اخبار دنیای موبایل و تکنولوژی',
    url: `${siteConfig.url}/news`,
  })
}

export default async function NewsListPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const brand = params.brand || undefined

  const where = {
    status: 'PUBLISHED' as const,
    postType: 'NEWS' as const,
    ...(brand ? { brands: { path: '$', array_contains: brand } } : {}),
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
        articles: { some: { status: 'PUBLISHED', postType: 'NEWS' } },
      },
      orderBy: { name: 'asc' },
      take: 20,
    }),
  ])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'خانه', url: siteConfig.url },
    { name: 'اخبار', url: `${siteConfig.url}/news` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="container mx-auto px-4 pb-12" dir="rtl">
        <Breadcrumb items={[{ label: 'اخبار' }]} />

        <h1 className="display-sm md:display-lg text-gray-900 mb-6">اخبار</h1>

        {/* Brand / Category Filter Chips */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            <Link
              href="/news"
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
                href={`/news?brand=${cat.slug}`}
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
                baseUrl="/news"
              />
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Ad Placeholder */}
              <div className="bg-gray-50 rounded-xl p-4 text-center min-h-[250px] flex-center">
                <span className="body-sm text-gray-300">تبلیغات</span>
              </div>
            </div>
          </aside>
        </div>

        {/* SEO Content Box */}
        <section className="mt-12 bg-gray-50 rounded-xl p-6">
          <h2 className="h2 text-gray-900 mb-3">اخبار موبایل و تکنولوژی</h2>
          <p className="body-sm text-gray-500 leading-relaxed">
            در بخش اخبار جی‌اس‌ام، آخرین اخبار و رویدادهای دنیای موبایل، تبلت، لپ‌تاپ و
            تکنولوژی را بخوانید. تیم خبری جی‌اس‌ام تلاش می‌کند تا به‌روزترین اخبار را در
            سریع‌ترین زمان ممکن در اختیار شما قرار دهد.
          </p>
        </section>
      </div>
    </>
  )
}
