import Link from 'next/link'
import Image from 'next/image'
import { Clock, User } from 'lucide-react'
import { cn, getImageUrl, getPostUrl, formatDateShort, toPersianDigits } from '@/lib/utils'

export interface ArticleCardArticle {
  id: number
  title: string
  slug: string
  excerpt?: string | null
  image?: string | null
  postType: string
  author?: {
    name: string
    avatar?: string | null
  } | null
  publishedAt?: string | Date | null
  readingTime?: number | null
}

interface ArticleCardProps {
  article: ArticleCardArticle
  className?: string
}

export default function ArticleCard({ article, className }: ArticleCardProps) {
  const href = getPostUrl(article.id, article.slug, article.postType)

  return (
    <Link
      href={href}
      className={cn(
        'flex gap-4 p-4 bg-white rounded-lg shadow-post-box hover:shadow-md transition-shadow group',
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
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 96px, 120px"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 min-w-0 justify-between">
        {/* Title */}
        <h3 className="subtitle-sm md:subtitle-lg text-gray-900 line-clamp-2 group-hover:text-primary-500 transition-colors">
          {article.title}
        </h3>

        {/* Excerpt - hidden on mobile */}
        {article.excerpt && (
          <p className="body-sm text-gray-500 line-clamp-1 hidden md:block mt-1">
            {article.excerpt}
          </p>
        )}

        {/* Footer: Author, Date, Reading Time */}
        <div className="flex items-center gap-3 mt-auto pt-2">
          {article.author && (
            <div className="flex items-center gap-1.5">
              {article.author.avatar ? (
                <Image
                  src={getImageUrl(article.author.avatar)}
                  alt={article.author.name}
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="size-6 rounded-full bg-gray-200 flex-center">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                </div>
              )}
              <span className="caption text-gray-600">{article.author.name}</span>
            </div>
          )}

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
