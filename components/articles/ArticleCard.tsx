import Link from 'next/link'
import Image from 'next/image'
import { Clock, User } from 'lucide-react'
import {
  cn,
  getImageUrl,
  getPostUrl,
  formatDateShort,
  toPersianDigits,
  stripHtml,
  getPostTypeBadge,
  getAuthorDisplayName,
} from '@/lib/utils'
import AuthorLink from '@/components/common/AuthorLink'

export interface ArticleCardArticle {
  id: number
  title: string
  slug: string
  excerpt?: string | null
  image?: string | null
  postType: string
  author?: {
    name: string
    slug?: string
    avatar?: string | null
  } | null
  publishedAt?: string | Date | null
  readingTime?: number | null
}

interface ArticleCardProps {
  article: ArticleCardArticle
  className?: string
  loading?: boolean
}

function ArticleCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex gap-4 p-4 bg-white rounded-lg shadow-post-box',
        className
      )}
      dir="rtl"
    >
      <div className="size-24 md:size-[7.5rem] rounded-lg flex-shrink-0 skeleton" />
      <div className="flex flex-col flex-1 min-w-0 justify-between">
        <div className="space-y-2">
          <div className="h-4 w-full skeleton" />
          <div className="h-4 w-3/4 skeleton" />
        </div>
        <div className="hidden md:block h-3 w-2/3 skeleton mt-2" />
        <div className="flex items-center gap-3 mt-auto pt-2">
          <div className="size-6 rounded-full skeleton" />
          <div className="h-3 w-16 skeleton" />
          <div className="h-3 w-20 skeleton" />
        </div>
      </div>
    </div>
  )
}

export default function ArticleCard({ article, className, loading }: ArticleCardProps) {
  if (loading) {
    return <ArticleCardSkeleton className={className} />
  }

  const href = getPostUrl(article.id, article.slug, article.postType)
  const postTypeBadge = getPostTypeBadge(article.postType)
  const authorName = getAuthorDisplayName(article.author?.name)

  return (
    <Link
      href={href}
      className={cn(
        `flex gap-4 p-4 bg-white rounded-lg shadow-post-box
         group cursor-pointer
         transition-all duration-300 ease-out
         hover:shadow-md hover:-translate-y-0.5`,
        className
      )}
      dir="rtl"
    >
      {/* Thumbnail */}
      <div className="relative size-24 md:size-[7.5rem] rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
        <Image
          src={getImageUrl(article.image)}
          alt={article.title}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          sizes="(max-width: 768px) 96px, 120px"
        />
        {postTypeBadge && (
          <span
            className={cn(
              'absolute top-1.5 right-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium leading-tight shadow-sm',
              postTypeBadge.className
            )}
          >
            {postTypeBadge.label}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 min-w-0 justify-between">
        {/* Title */}
        <h3 className="subtitle-sm md:subtitle-lg text-gray-900 line-clamp-2 group-hover:text-primary-500 transition-colors duration-300">
          {article.title}
        </h3>

        {/* Excerpt - hidden on mobile */}
        {article.excerpt && (
          <p className="body-sm text-gray-500 line-clamp-1 hidden md:block mt-1">
            {stripHtml(article.excerpt)}
          </p>
        )}

        {/* Footer: Author, Date, Reading Time */}
        <div className="flex items-center gap-3 mt-auto pt-2">
          <div className="flex items-center gap-1.5">
            {article.author?.avatar ? (
              <Image
                src={getImageUrl(article.author.avatar)}
                alt={authorName}
                width={24}
                height={24}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="size-6 rounded-full bg-gray-200 flex-center">
                <User className="w-3.5 h-3.5 text-gray-400" />
              </div>
            )}
            {article.author?.slug ? (
              <AuthorLink slug={article.author.slug} name={authorName} />
            ) : (
              <span className="caption text-gray-600">{authorName}</span>
            )}
          </div>

          {article.publishedAt && (
            <span className="caption text-gray-400">
              {formatDateShort(article.publishedAt)}
            </span>
          )}

          {article.readingTime && (
            <div className="flex items-center gap-1 caption text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{toPersianDigits(article.readingTime)} دقیقه</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
