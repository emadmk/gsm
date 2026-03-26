import { Metadata } from 'next'
import prisma from '@/lib/db'
import { generateSeoMeta, siteConfig } from '@/lib/seo'
import ArticleCard from '@/components/articles/ArticleCard'
import SearchBox from '@/components/common/SearchBox'
import Pagination from '@/components/common/Pagination'
import { toPersianDigits } from '@/lib/utils'
import { Search } from 'lucide-react'

const ITEMS_PER_PAGE = 10

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const query = params.q || ''
  return generateSeoMeta({
    title: query ? `نتایج جستجو برای "${query}"` : 'جستجو',
    description: `جستجو در مطالب جی‌اس‌ام${query ? ` - ${query}` : ''}`,
    url: `${siteConfig.url}/search${query ? `?q=${encodeURIComponent(query)}` : ''}`,
  })
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams
  const query = params.q?.trim() || ''
  const page = Math.max(1, Number(params.page) || 1)

  let articles: Awaited<ReturnType<typeof prisma.article.findMany>> = []
  let totalCount = 0

  if (query) {
    const where = {
      status: 'PUBLISHED' as const,
      title: { contains: query, mode: 'insensitive' as const },
    }

    ;[articles, totalCount] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
        include: { author: true, category: true },
      }),
      prisma.article.count({ where }),
    ])
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="container mx-auto px-4 pb-12" dir="rtl">
      {/* Search Input */}
      <div className="max-w-2xl mx-auto py-8">
        <SearchBox autoFocus className="w-full" />
      </div>

      {/* Results */}
      {query ? (
        <>
          <div className="flex items-center gap-2 mb-6">
            <Search className="w-5 h-5 text-gray-400" />
            <h1 className="h2 text-gray-900">
              نتایج جستجو برای{' '}
              <span className="text-primary-500">&laquo;{query}&raquo;</span>
            </h1>
            <span className="body-sm text-gray-400">
              ({toPersianDigits(totalCount)} نتیجه)
            </span>
          </div>

          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="size-16 rounded-full bg-gray-100 flex-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p className="body-lg text-gray-400 mb-2">نتیجه‌ای یافت نشد</p>
              <p className="body-sm text-gray-300">
                لطفا عبارت دیگری را جستجو کنید
              </p>
            </div>
          )}

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              baseUrl="/search"
            />
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="size-16 rounded-full bg-gray-100 flex-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-300" />
          </div>
          <p className="body-lg text-gray-500">
            عبارت مورد نظر خود را در کادر بالا وارد کنید
          </p>
        </div>
      )}
    </div>
  )
}
