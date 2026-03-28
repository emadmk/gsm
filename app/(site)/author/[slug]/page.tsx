import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import prisma from '@/lib/db'
import { generateSeoMeta, generateBreadcrumbSchema, siteConfig } from '@/lib/seo'
import { getImageUrl, toPersianDigits } from '@/lib/utils'
import Breadcrumb from '@/components/common/Breadcrumb'
import ArticleCard from '@/components/articles/ArticleCard'
import Pagination from '@/components/common/Pagination'
import { User } from 'lucide-react'

const ITEMS_PER_PAGE = 10

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const author = await prisma.author.findUnique({ where: { slug } })
  if (!author) return {}

  return generateSeoMeta({
    title: author.name,
    description: author.bio || `مطالب ${author.name} در جی‌اس‌ام`,
    image: author.avatar ? getImageUrl(author.avatar) : undefined,
    url: `${siteConfig.url}/author/${slug}`,
  })
}

export default async function AuthorPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)

  const author = await prisma.author.findUnique({ where: { slug } })
  if (!author) notFound()

  const where = {
    status: 'PUBLISHED' as const,
    authorId: author.id,
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
    { name: author.name, url: `${siteConfig.url}/author/${slug}` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="container mx-auto px-4 pb-12" dir="rtl">
        <Breadcrumb items={[{ label: author.name }]} />

        {/* Author Info Card */}
        <section className="bg-white rounded-xl shadow-post-box p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
            <div className="flex-shrink-0">
              {author.avatar ? (
                <Image
                  src={getImageUrl(author.avatar)}
                  alt={author.name}
                  width={96}
                  height={96}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="size-24 rounded-full bg-gray-200 flex-center">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
              )}
            </div>
            <div className="text-center sm:text-right">
              <h1 className="display-sm text-gray-900">{author.name}</h1>
              {author.label && (
                <p className="body-sm text-primary-500 mt-1">{author.label}</p>
              )}
              {author.bio && (
                <p className="body-sm text-gray-500 mt-3 leading-relaxed max-w-2xl">
                  {author.bio}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 justify-center sm:justify-start">
                <span className="body-sm text-gray-400">
                  {toPersianDigits(totalCount)} مطلب
                </span>
                <span className="body-sm text-gray-400">
                  {toPersianDigits(author.viewCount)} بازدید
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Author's Articles */}
        <h2 className="h2 text-gray-900 mb-4">
          مطالب {author.name}
        </h2>

        {articles.length > 0 ? (
          <div className="space-y-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="body-lg text-gray-400">هنوز مطلبی منتشر نشده است.</p>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl={`/author/${slug}`}
          />
        )}
      </div>
    </>
  )
}
