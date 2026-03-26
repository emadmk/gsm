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
  siteConfig,
} from '@/lib/seo'
import {
  getPostUrl,
  formatDateShort,
  calculateReadingTime,
  getPostTypeLabel,
  getImageUrl,
  toPersianDigits,
  formatDate,
} from '@/lib/utils'
import Breadcrumb from '@/components/common/Breadcrumb'
import ShareButton from '@/components/common/ShareButton'
import Badge from '@/components/ui/Badge'
import { Clock, Calendar, Edit3, MessageCircle, User } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string; slug: string }>
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
      id: { not: articleId },
      categoryId: categoryId ?? undefined,
    },
    orderBy: { publishedAt: 'desc' },
    take: 4,
    include: { author: true, category: true },
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

export default async function NewsPage({ params }: PageProps) {
  const { id } = await params
  const article = await getArticle(Number(id))
  if (!article) notFound()

  const relatedArticles = await getRelatedArticles(article.id, article.categoryId)

  const articleUrl = `${siteConfig.url}${getPostUrl(article.id, article.slug, article.postType)}`
  const readingTime = article.readingTime || (article.wordCount ? calculateReadingTime(article.wordCount) : 3)
  const commentsCount = article.comments.reduce(
    (acc, c) => acc + 1 + c.replies.length,
    0
  )

  const breadcrumbItems = [
    { label: 'اخبار', href: '/news' },
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

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'خانه', url: siteConfig.url },
    { name: 'اخبار', url: `${siteConfig.url}/news` },
    { name: article.title, url: articleUrl },
  ])

  const faqData = article.faq as { question: string; answer: string }[] | null
  const faqSchema = faqData?.length ? generateFaqSchema(faqData) : null

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
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <article className="container mx-auto px-4 pb-12" dir="rtl">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.map(({ tag }) => (
              <Link key={tag.id} href={`/tag/${tag.slug}`}>
                <Badge variant="primary" size="sm">
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="display-sm md:display-lg text-gray-900 mb-4 leading-relaxed">
          {article.title}
        </h1>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-gray-500 body-sm">
          {article.author && (
            <Link
              href={`/author/${article.author.slug}`}
              className="flex items-center gap-1.5 hover:text-primary-500 transition-colors"
            >
              {article.author.avatar ? (
                <Image
                  src={getImageUrl(article.author.avatar)}
                  alt={article.author.name}
                  width={28}
                  height={28}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="size-7 rounded-full bg-gray-200 flex-center">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
              )}
              <span>{article.author.name}</span>
            </Link>
          )}

          {article.publishedAt && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(article.publishedAt)}</span>
            </div>
          )}

          {article.modifiedAt && (
            <div className="flex items-center gap-1 text-green-500">
              <Edit3 className="w-4 h-4" />
              <span>آپدیت: {formatDateShort(article.modifiedAt)}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{toPersianDigits(readingTime)} دقیقه مطالعه</span>
          </div>

          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>{toPersianDigits(commentsCount)} دیدگاه</span>
          </div>

          <ShareButton url={articleUrl} title={article.title} />
        </div>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="body-lg text-gray-600 bg-gray-50 rounded-lg p-4 mb-6 leading-relaxed border-r-4 border-primary-500">
            {article.excerpt}
          </p>
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

        {/* Post Content */}
        {article.content && (
          <div
            className="post-content prose prose-lg max-w-none text-gray-800 leading-loose mb-8"
            dangerouslySetInnerHTML={{ __html: article.content }}
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

        {/* Author Box */}
        {article.author && (
          <section className="bg-white rounded-xl shadow-post-box p-6 mb-8">
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
                  <div className="size-20 rounded-full bg-gray-200 flex-center">
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
        <section className="mb-8" id="comments">
          <h2 className="h2 text-gray-900 mb-4">
            دیدگاه‌ها ({toPersianDigits(commentsCount)})
          </h2>

          {article.comments.length > 0 ? (
            <div className="space-y-4">
              {article.comments.map((comment) => (
                <div key={comment.id} className="bg-white rounded-lg shadow-post-box p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-8 rounded-full bg-gray-200 flex-center">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="subtitle-sm text-gray-800">{comment.authorName}</span>
                    {comment.isAdmin && (
                      <Badge variant="primary" size="sm">مدیر</Badge>
                    )}
                    <span className="caption text-gray-400 mr-auto">
                      {formatDateShort(comment.createdAt)}
                    </span>
                  </div>
                  <p className="body-sm text-gray-600 leading-relaxed">{comment.content}</p>

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="mr-8 mt-3 space-y-3 border-r-2 border-gray-100 pr-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="size-6 rounded-full bg-gray-200 flex-center">
                              <User className="w-3 h-3 text-gray-400" />
                            </div>
                            <span className="subtitle-sm text-gray-800 text-sm">
                              {reply.authorName}
                            </span>
                            {reply.isAdmin && (
                              <Badge variant="primary" size="sm">مدیر</Badge>
                            )}
                            <span className="caption text-gray-400 mr-auto">
                              {formatDateShort(reply.createdAt)}
                            </span>
                          </div>
                          <p className="body-sm text-gray-600 leading-relaxed">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="body-sm text-gray-400">هنوز دیدگاهی ثبت نشده است.</p>
          )}
        </section>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section>
            <h2 className="h2 text-gray-900 mb-4">مطالب مرتبط</h2>
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
                    {post.publishedAt && (
                      <span className="caption text-gray-400 mt-1 block">
                        {formatDateShort(post.publishedAt)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  )
}
