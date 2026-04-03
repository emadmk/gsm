import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import prisma from '@/lib/db'
import {
  generateSeoMeta,
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateFaqSchema,
  generateReviewSchema,
  siteConfig,
} from '@/lib/seo'
import {
  getPostUrl,
  formatDateShort,
  calculateReadingTime,
  getImageUrl,
  toPersianDigits,
  formatDate,
  cleanHtmlContent,
  getAuthorDisplayName,
} from '@/lib/utils'
import Breadcrumb from '@/components/common/Breadcrumb'
import ShareButton from '@/components/common/ShareButton'
import CommentSection, { Comment } from '@/components/articles/CommentSection'
import { MessageCircle, User, ThumbsUp, ThumbsDown } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string; slug: string }>
}

interface ReviewPoints {
  pros?: string[]
  cons?: string[]
  score?: number
}

async function getArticle(id: number) {
  const article = await prisma.article.findFirst({
    where: { id, status: 'PUBLISHED' },
    include: {
      author: true,
      category: true,
      tags: { include: { tag: true } },
      comments: {
        where: { isApproved: true, parentId: null },
        include: {
          replies: {
            where: { isApproved: true },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  return article
}

async function getRelatedArticles(articleId: number, categoryId: number | null) {
  return prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      postType: 'REVIEW',
      id: { not: articleId },
      categoryId: categoryId ?? undefined,
    },
    orderBy: { publishedAt: 'desc' },
    take: 4,
    include: { author: true, category: true },
  })
}

async function getLatestArticles(excludeId: number) {
  return prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      id: { not: excludeId },
    },
    orderBy: { publishedAt: 'desc' },
    take: 6,
    select: {
      id: true,
      title: true,
      slug: true,
      image: true,
      postType: true,
    },
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const article = await getArticle(Number(id))
  if (!article) return {}

  const url = `${siteConfig.url}${getPostUrl(article.id, article.slug, article.postType)}`
  return generateSeoMeta({
    title: article.metaTitle || article.title,
    description: article.metaDesc || article.excerpt || undefined,
    image: article.image ? getImageUrl(article.image) : undefined,
    url,
    type: 'article',
    keywords: article.tags.map((t) => t.tag.name),
  })
}

export default async function ReviewPage({ params }: PageProps) {
  const { id } = await params
  const article = await getArticle(Number(id))
  if (!article) notFound()

  const [relatedArticles, latestArticles] = await Promise.all([
    getRelatedArticles(article.id, article.categoryId),
    getLatestArticles(article.id),
  ])

  const articleUrl = `${siteConfig.url}${getPostUrl(article.id, article.slug, article.postType)}`
  const authorName = getAuthorDisplayName(article.author?.name)
  const readingTime = article.readingTime || (article.wordCount ? calculateReadingTime(article.wordCount) : 3)
  const commentsCount = article.comments.reduce(
    (acc, c) => acc + 1 + c.replies.length,
    0
  )

  const points = article.points as ReviewPoints | null

  const breadcrumbItems = [
    { label: 'بررسی‌ها', href: '/reviews' },
    ...(article.category
      ? [{ label: article.category.name, href: `/category/${article.category.slug}` }]
      : []),
    { label: article.title },
  ]

  const articleSchema = generateArticleSchema({
    title: article.title,
    description: article.excerpt || '',
    image: getImageUrl(article.image),
    author: article.author?.name || siteConfig.nameEn,
    datePublished: article.publishedAt?.toISOString() || '',
    dateModified: article.modifiedAt?.toISOString() || article.publishedAt?.toISOString() || '',
    url: articleUrl,
  })

  const reviewSchema = points
    ? generateReviewSchema({
        title: article.title,
        description: article.excerpt || '',
        image: getImageUrl(article.image),
        author: article.author?.name || siteConfig.nameEn,
        datePublished: article.publishedAt?.toISOString() || '',
        dateModified: article.modifiedAt?.toISOString() || article.publishedAt?.toISOString() || '',
        url: articleUrl,
        itemName: article.title,
        score: points.score,
      })
    : null

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'خانه', url: siteConfig.url },
    { name: 'بررسی‌ها', url: `${siteConfig.url}/reviews` },
    { name: article.title, url: articleUrl },
  ])

  const faqData = article.faq as { question: string; answer: string }[] | null
  const faqSchema = faqData?.length ? generateFaqSchema(faqData) : null

  // Map comments for the CommentSection component
  const mappedComments: Comment[] = article.comments.map((comment) => ({
    id: comment.id,
    author: comment.authorName,
    email: comment.authorEmail ?? undefined,
    content: comment.content,
    isAdmin: comment.isAdmin,
    createdAt: comment.createdAt,
    replies: comment.replies.map((reply) => ({
      id: reply.id,
      author: reply.authorName,
      email: reply.authorEmail ?? undefined,
      content: reply.content,
      isAdmin: reply.isAdmin,
      createdAt: reply.createdAt,
    })),
  }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {reviewSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
        />
      )}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <div className="bg-gray-50 min-h-screen" dir="rtl">
        <div className="container xl:max-w-screen-xl mx-auto py-4 lg:px-10">
          {/* Two Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-4 md:gap-6">
            {/* Main Content (Right) */}
            <div>
              <article className="bg-white md:rounded-lg px-4 pb-4 md:p-6 shadow-post-box">
                {/* Breadcrumb */}
                <Breadcrumb items={breadcrumbItems} />

                {/* Tags */}
                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags.map(({ tag }) => (
                      <Link key={tag.id} href={`/tag/${tag.slug}`}>
                        <span className="inline-block px-3 py-1 rounded-md bg-primary-500/[0.08] text-primary-500 text-sm font-medium">
                          {tag.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h1 className="display-sm md:display-lg text-gray-900 mb-4 leading-relaxed">
                  {article.title}
                </h1>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-6 text-gray-500 body-sm">
                  <span>
                    نوشته{' '}
                    {article.author?.slug ? (
                      <Link
                        href={`/author/${article.author.slug}`}
                        className="text-primary-500 hover:underline"
                      >
                        {authorName}
                      </Link>
                    ) : (
                      <span className="text-primary-500">{authorName}</span>
                    )}
                  </span>
                  <span className="text-gray-300">&#xB7;</span>

                  {article.publishedAt && (
                    <span>منتشر شده در {formatDate(article.publishedAt)}</span>
                  )}
                  {article.publishedAt && <span className="text-gray-300">&#xB7;</span>}

                  {article.modifiedAt && (
                    <>
                      <span>بروزرسانی در {formatDateShort(article.modifiedAt)}</span>
                      <span className="text-gray-300">&#xB7;</span>
                    </>
                  )}

                  <span>مطالعه {toPersianDigits(readingTime)} دقیقه</span>

                  <div className="flex items-center gap-3 mr-auto">
                    <ShareButton url={articleUrl} title={article.title} />
                    <Link href="#comments" className="flex items-center gap-1 text-gray-400 hover:text-primary-500 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span>{toPersianDigits(commentsCount)}</span>
                    </Link>
                  </div>
                </div>

                {/* Excerpt */}
                {article.excerpt && (
                  <div className="bg-primary-20 border border-primary-500/10 rounded-lg p-4 mb-6 body-lg text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: article.excerpt }}
                  />
                )}

                {/* Featured Image */}
                {article.image && (
                  <figure className="mb-8">
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
                      <Image
                        src={getImageUrl(article.image)}
                        alt={article.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 800px"
                        priority
                      />
                    </div>
                    {article.imageCaption && (
                      <figcaption className="text-center caption text-gray-400 mt-2">
                        {article.imageCaption}
                      </figcaption>
                    )}
                  </figure>
                )}

                {/* Review Points (Pros/Cons) */}
                {points && (points.pros?.length || points.cons?.length) && (
                  <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pros */}
                    {points.pros && points.pros.length > 0 && (
                      <div className="bg-green-500/[0.05] border border-green-500/20 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <ThumbsUp className="w-5 h-5 text-green-500" />
                          <h3 className="h3 text-green-500">نقاط قوت</h3>
                        </div>
                        <ul className="space-y-2">
                          {points.pros.map((pro, index) => (
                            <li key={index} className="flex items-start gap-2 body-sm text-gray-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Cons */}
                    {points.cons && points.cons.length > 0 && (
                      <div className="bg-red-500/[0.05] border border-red-500/20 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <ThumbsDown className="w-5 h-5 text-red-500" />
                          <h3 className="h3 text-red-500">نقاط ضعف</h3>
                        </div>
                        <ul className="space-y-2">
                          {points.cons.map((con, index) => (
                            <li key={index} className="flex items-start gap-2 body-sm text-gray-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Score */}
                    {points.score !== undefined && points.score !== null && (
                      <div className="md:col-span-2 flex items-center justify-center gap-3 bg-primary-500/[0.05] rounded-xl p-4">
                        <span className="h2 text-gray-700">امتیاز کلی:</span>
                        <span className="display-sm text-primary-500">{toPersianDigits(points.score)}</span>
                        <span className="body-sm text-gray-400">از ۱۰</span>
                      </div>
                    )}
                  </section>
                )}

                {/* Post Content */}
                {article.content && (
                  <div
                    className="post-content prose prose-lg max-w-none text-gray-800 leading-loose mb-8"
                    dangerouslySetInnerHTML={{ __html: cleanHtmlContent(article.content) }}
                  />
                )}

                {/* FAQ Section */}
                {faqData && faqData.length > 0 && (
                  <section className="bg-gray-50 rounded-xl p-6 mb-8">
                    <h2 className="h2 text-gray-900 mb-4">سوالات متداول</h2>
                    <div className="space-y-4">
                      {faqData.map((item, index) => (
                        <details
                          key={index}
                          className="bg-white rounded-lg p-4 shadow-post-box group"
                        >
                          <summary className="subtitle-lg text-gray-900 cursor-pointer list-none flex items-center justify-between">
                            {item.question}
                            <span className="text-gray-400 group-open:rotate-180 transition-transform">
                              &#9660;
                            </span>
                          </summary>
                          <p className="body-lg text-gray-600 mt-3 leading-relaxed">{item.answer}</p>
                        </details>
                      ))}
                    </div>
                  </section>
                )}
              </article>

              {/* Author Box */}
              {article.author && (
                <section className="bg-white md:rounded-lg shadow-post-box p-6 mt-4 md:mt-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      {article.author.avatar ? (
                        <Image
                          src={getImageUrl(article.author.avatar)}
                          alt={article.author.name}
                          width={80}
                          height={80}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="size-20 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/author/${article.author.slug}`}
                        className="h3 text-gray-900 hover:text-primary-500 transition-colors"
                      >
                        {article.author.name}
                      </Link>
                      {article.author.label && (
                        <p className="body-sm text-primary-500 mt-0.5">{article.author.label}</p>
                      )}
                      {article.author.bio && (
                        <p className="body-sm text-gray-500 mt-2 leading-relaxed">
                          {article.author.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Comments Section */}
              <div className="bg-white md:rounded-lg shadow-post-box p-4 md:p-6 mt-4 md:mt-6" id="comments">
                <CommentSection
                  postId={article.id}
                  comments={mappedComments}
                  totalComments={commentsCount}
                />
              </div>

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <section className="mt-4 md:mt-6">
                  <h2 className="h2 text-gray-900 mb-4">بررسی‌های مرتبط</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {relatedArticles.map((post) => (
                      <Link
                        key={post.id}
                        href={getPostUrl(post.id, post.slug, post.postType)}
                        className="bg-white rounded-lg shadow-post-box overflow-hidden group hover:shadow-md transition-shadow"
                      >
                        <div className="relative w-full aspect-video bg-gray-100">
                          <Image
                            src={getImageUrl(post.image)}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 100vw, 25vw"
                          />
                        </div>
                        <div className="p-3">
                          <h3 className="subtitle-sm text-gray-900 line-clamp-2 group-hover:text-primary-500 transition-colors">
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="caption text-gray-500">{getAuthorDisplayName(post.author?.name)}</span>
                            {post.publishedAt && (
                              <span className="caption text-gray-300">&#xB7;</span>
                            )}
                            {post.publishedAt && (
                              <span className="caption text-gray-400">
                                {formatDateShort(post.publishedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar (Left) */}
            <aside className="hidden md:block">
              <div className="sticky top-4">
                <div className="bg-white rounded-lg shadow-post-box p-4">
                  <h3 className="h4 text-gray-900 mb-4 pb-3 border-b border-gray-100">
                    جدیدترین مطالب
                  </h3>
                  <div className="space-y-4">
                    {latestArticles.map((post) => (
                      <Link
                        key={post.id}
                        href={getPostUrl(post.id, post.slug, post.postType)}
                        className="flex gap-3 group"
                      >
                        <div className="relative size-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={getImageUrl(post.image)}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="80px"
                          />
                        </div>
                        <h4 className="subtitle-sm text-gray-800 line-clamp-2 group-hover:text-primary-500 transition-colors leading-relaxed">
                          {post.title}
                        </h4>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}
