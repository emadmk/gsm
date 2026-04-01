import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/db'
import { generateSeoMeta, generateWebSiteSchema, siteConfig } from '@/lib/seo'
import {
  getPostUrl,
  formatDateShort,
  calculateReadingTime,
  getPostTypeLabel,
  getImageUrl,
  toPersianDigits,
} from '@/lib/utils'
import { Clock, User, Eye, RefreshCw } from 'lucide-react'
import ScrollAnimations from './ScrollAnimations'
import AuthorLink from '@/components/common/AuthorLink'

// Force dynamic rendering - prevents stale cache (fixes 1398 date issue)
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoMeta({
    title: 'صفحه اصلی',
    description: siteConfig.description,
    url: siteConfig.url,
  })
}

export default async function HomePage() {
  const [stories, latestPosts, reviews, news, articles, mostViewed, updatedPosts] =
    await Promise.all([
      // Stories
      prisma.story.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        take: 20,
      }),
      // Latest posts
      prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        include: { author: true, category: true },
      }),
      // Reviews
      prisma.article.findMany({
        where: { status: 'PUBLISHED', postType: 'REVIEW' },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        include: { author: true, category: true },
      }),
      // News
      prisma.article.findMany({
        where: { status: 'PUBLISHED', postType: 'NEWS' },
        orderBy: { publishedAt: 'desc' },
        take: 4,
        include: { author: true, category: true },
      }),
      // Articles
      prisma.article.findMany({
        where: { status: 'PUBLISHED', postType: 'ARTICLE' },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        include: { author: true, category: true },
      }),
      // Most viewed
      prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { viewCount: 'desc' },
        take: 5,
        include: { author: true, category: true },
      }),
      // Updated posts
      prisma.article.findMany({
        where: { status: 'PUBLISHED', modifiedAt: { not: null } },
        orderBy: { modifiedAt: 'desc' },
        take: 10,
        include: { author: true },
      }),
    ])

  const websiteSchema = generateWebSiteSchema()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      {/* Client component for scroll-based animations */}
      <ScrollAnimations />

      <div className="container mx-auto px-4" dir="rtl">
        {/* Stories Slider */}
        {stories.length > 0 && (
          <section className="py-4 fade-section">
            <div className="flex gap-4 pb-2 overflow-x-auto no-scrollbar">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="flex flex-col items-center flex-shrink-0 group cursor-pointer"
                >
                  <div className="
                    w-16 h-16 md:w-20 md:h-20 rounded-full
                    ring-2 ring-primary-500 ring-offset-2
                    overflow-hidden bg-gray-100
                    transition-transform duration-300
                    group-hover:scale-105 group-hover:ring-primary-600
                  ">
                    <Image
                      src={getImageUrl(story.cover)}
                      alt={story.title}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <span className="caption text-gray-700 mt-1.5 max-w-[5rem] text-center truncate group-hover:text-primary-500 transition-colors">
                    {story.title}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Updated Posts Ticker */}
        {updatedPosts.length > 0 && (
          <section className="bg-gray-50 rounded-lg p-3 mb-6 flex items-center gap-3 overflow-hidden fade-section">
            <div className="flex items-center gap-1.5 flex-shrink-0 text-primary-500">
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              <span className="subtitle-sm whitespace-nowrap">مطالب آپدیت شده:</span>
            </div>
            <div className="overflow-hidden relative flex-1">
              <div className="flex gap-6 marquee-track">
                {/* Duplicate items for seamless loop */}
                {[...updatedPosts, ...updatedPosts].map((post, idx) => (
                  <Link
                    key={`${post.id}-${idx}`}
                    href={getPostUrl(post.id, post.slug, post.postType)}
                    className="body-sm text-gray-600 hover:text-primary-500 transition-colors whitespace-nowrap"
                  >
                    {post.title}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Latest Posts Grid */}
        {latestPosts.length > 0 && (
          <section className="mb-8 fade-section">
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4">
              {/* First Post - Large */}
              <Link
                href={getPostUrl(latestPosts[0].id, latestPosts[0].slug, latestPosts[0].postType)}
                className="md:col-span-2 md:row-span-2 relative rounded-xl overflow-hidden group min-h-[300px] md:min-h-[400px]"
              >
                <Image
                  src={getImageUrl(latestPosts[0].image)}
                  alt={latestPosts[0].title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-300 group-hover:from-black/90" />
                <div className="absolute bottom-0 right-0 left-0 p-5 transition-transform duration-300 group-hover:translate-y-[-4px]">
                  {latestPosts[0].category && (
                    <span className="inline-block px-3 py-1 bg-primary-500 text-white caption rounded-full mb-2">
                      {latestPosts[0].category.name}
                    </span>
                  )}
                  <h2 className="h2 md:h1 text-white leading-relaxed">
                    {latestPosts[0].title}
                  </h2>
                  <div className="flex items-center gap-3 mt-2 text-gray-200 caption">
                    {latestPosts[0].author && (
                      <AuthorLink slug={latestPosts[0].author.slug} name={latestPosts[0].author.name} className="hover:text-white transition-colors cursor-pointer" />
                    )}
                    {latestPosts[0].publishedAt && (
                      <span>{formatDateShort(latestPosts[0].publishedAt)}</span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Smaller Posts */}
              {latestPosts.slice(1, 5).map((post) => (
                <Link
                  key={post.id}
                  href={getPostUrl(post.id, post.slug, post.postType)}
                  className="relative rounded-xl overflow-hidden group min-h-[180px]"
                >
                  <Image
                    src={getImageUrl(post.image)}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 right-0 left-0 p-3 transition-transform duration-300 group-hover:translate-y-[-2px]">
                    {post.category && (
                      <span className="inline-block px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full mb-1.5">
                        {post.category.name}
                      </span>
                    )}
                    <h3 className="subtitle-sm text-white line-clamp-2">{post.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <section className="mb-8 fade-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="h2 text-gray-900">بررسی‌های تخصصی</h2>
              <Link href="/reviews" className="body-sm text-primary-500 hover:underline transition-all hover:gap-2 flex items-center gap-1">
                مشاهده همه
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* First Review - Large */}
              <Link
                href={getPostUrl(reviews[0].id, reviews[0].slug, reviews[0].postType)}
                className="md:col-span-1 md:row-span-2 relative rounded-xl overflow-hidden group min-h-[280px]"
              >
                <Image
                  src={getImageUrl(reviews[0].image)}
                  alt={reviews[0].title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 right-0 left-0 p-4 transition-transform duration-300 group-hover:translate-y-[-2px]">
                  <span className="inline-block px-2 py-0.5 bg-green-500 text-white text-xs rounded-full mb-2">
                    بررسی
                  </span>
                  <h3 className="h3 text-white line-clamp-2">{reviews[0].title}</h3>
                </div>
              </Link>

              {/* Other Reviews */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reviews.slice(1, 5).map((review) => (
                  <Link
                    key={review.id}
                    href={getPostUrl(review.id, review.slug, review.postType)}
                    className="
                      flex gap-3 bg-white rounded-lg shadow-post-box p-3
                      transition-all duration-300 ease-out
                      hover:shadow-md hover:-translate-y-0.5
                      group
                    "
                  >
                    <div className="relative w-24 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image
                        src={getImageUrl(review.image)}
                        alt={review.title}
                        fill
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                        sizes="96px"
                      />
                    </div>
                    <div className="flex flex-col justify-between min-w-0">
                      <h3 className="subtitle-sm text-gray-900 line-clamp-2 group-hover:text-primary-500 transition-colors duration-300">
                        {review.title}
                      </h3>
                      {review.publishedAt && (
                        <span className="caption text-gray-400">
                          {formatDateShort(review.publishedAt)}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Two-Column Layout: News & Articles + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
          {/* Left Column (3fr) */}
          <div className="lg:col-span-3 space-y-8">
            {/* News Section */}
            {news.length > 0 && (
              <section className="fade-section">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="h2 text-gray-900">اخبار</h2>
                  <Link href="/news" className="body-sm text-primary-500 hover:underline">
                    مشاهده همه
                  </Link>
                </div>
                <div className="space-y-3">
                  {news.map((item) => (
                    <Link
                      key={item.id}
                      href={getPostUrl(item.id, item.slug, item.postType)}
                      className="
                        flex gap-4 bg-white rounded-lg shadow-post-box p-3
                        transition-all duration-300 ease-out
                        hover:shadow-md hover:-translate-y-0.5
                        group
                      "
                    >
                      <div className="relative w-28 h-24 md:w-32 md:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <Image
                          src={getImageUrl(item.image)}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                          sizes="128px"
                        />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0 justify-between">
                        <h3 className="subtitle-sm md:subtitle-lg text-gray-900 line-clamp-2 group-hover:text-primary-500 transition-colors duration-300">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-auto pt-2">
                          {item.author && (
                            <div className="flex items-center gap-1.5">
                              {item.author.avatar ? (
                                <Image
                                  src={getImageUrl(item.author.avatar)}
                                  alt={item.author.name}
                                  width={20}
                                  height={20}
                                  className="rounded-full object-cover"
                                />
                              ) : (
                                <div className="size-5 rounded-full bg-gray-200 flex-center">
                                  <User className="w-3 h-3 text-gray-400" />
                                </div>
                              )}
                              <AuthorLink slug={item.author.slug} name={item.author.name} />
                            </div>
                          )}
                          {item.publishedAt && (
                            <span className="caption text-gray-400">
                              {formatDateShort(item.publishedAt)}
                            </span>
                          )}
                          {item.readingTime && (
                            <div className="flex items-center gap-1 caption text-gray-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{toPersianDigits(item.readingTime)} دقیقه</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Articles Section */}
            {articles.length > 0 && (
              <section className="fade-section">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="h2 text-gray-900">مقالات</h2>
                  <Link href="/articles" className="body-sm text-primary-500 hover:underline">
                    مشاهده همه
                  </Link>
                </div>
                <div className="space-y-3">
                  {articles.map((item) => (
                    <Link
                      key={item.id}
                      href={getPostUrl(item.id, item.slug, item.postType)}
                      className="
                        flex gap-4 bg-white rounded-lg shadow-post-box p-3
                        transition-all duration-300 ease-out
                        hover:shadow-md hover:-translate-y-0.5
                        group
                      "
                    >
                      <div className="relative w-28 h-24 md:w-32 md:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <Image
                          src={getImageUrl(item.image)}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                          sizes="128px"
                        />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0 justify-between">
                        <h3 className="subtitle-sm md:subtitle-lg text-gray-900 line-clamp-2 group-hover:text-primary-500 transition-colors duration-300">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-auto pt-2">
                          {item.author && (
                            <div className="flex items-center gap-1.5">
                              {item.author.avatar ? (
                                <Image
                                  src={getImageUrl(item.author.avatar)}
                                  alt={item.author.name}
                                  width={20}
                                  height={20}
                                  className="rounded-full object-cover"
                                />
                              ) : (
                                <div className="size-5 rounded-full bg-gray-200 flex-center">
                                  <User className="w-3 h-3 text-gray-400" />
                                </div>
                              )}
                              <AuthorLink slug={item.author.slug} name={item.author.name} />
                            </div>
                          )}
                          {item.publishedAt && (
                            <span className="caption text-gray-400">
                              {formatDateShort(item.publishedAt)}
                            </span>
                          )}
                          {item.readingTime && (
                            <div className="flex items-center gap-1 caption text-gray-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{toPersianDigits(item.readingTime)} دقیقه</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar (2fr) */}
          <aside className="lg:col-span-2 fade-section">
            <div className="bg-blue-50 rounded-xl p-4 sticky top-20">
              <h2 className="h3 text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary-500" />
                پربازدیدترین مطالب
              </h2>
              <div className="space-y-3">
                {mostViewed.map((post, index) => (
                  <Link
                    key={post.id}
                    href={getPostUrl(post.id, post.slug, post.postType)}
                    className="
                      flex gap-3 group p-2 -mx-2 rounded-lg
                      transition-all duration-300
                      hover:bg-white/60
                    "
                  >
                    <span className="
                      flex-shrink-0 w-7 h-7 rounded-full bg-primary-500
                      text-white flex-center subtitle-sm
                      transition-transform duration-300
                      group-hover:scale-110
                    ">
                      {toPersianDigits(index + 1)}
                    </span>
                    <div className="min-w-0">
                      <h3 className="subtitle-sm text-gray-800 line-clamp-2 group-hover:text-primary-500 transition-colors duration-300">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="caption text-gray-400">
                          {post.publishedAt ? formatDateShort(post.publishedAt) : ''}
                        </span>
                        <span className="caption text-gray-400">
                          {toPersianDigits(post.viewCount)} بازدید
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
