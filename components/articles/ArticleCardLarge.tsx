import Link from 'next/link'
import Image from 'next/image'
import Badge from '@/components/ui/Badge'
import { cn, getImageUrl, getPostUrl, getPostTypeLabel } from '@/lib/utils'
import type { ArticleCardArticle } from './ArticleCard'

interface ArticleCardLargeProps {
  article: ArticleCardArticle
  className?: string
}

export default function ArticleCardLarge({ article, className }: ArticleCardLargeProps) {
  const href = getPostUrl(article.id, article.slug, article.postType)

  return (
    <Link
      href={href}
      className={cn(
        'relative block w-full aspect-[16/9] rounded-lg overflow-hidden group',
        className
      )}
      dir="rtl"
    >
      {/* Background Image */}
      <Image
        src={getImageUrl(article.image)}
        alt={article.title}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500"
        sizes="(max-width: 768px) 100vw, 50vw"
        priority
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Content Overlay */}
      <div className="absolute bottom-0 right-0 left-0 p-4 md:p-6 space-y-2">
        {/* Post Type Badge */}
        <Badge variant="primary" size="sm" className="bg-white/20 text-white backdrop-blur-sm">
          {getPostTypeLabel(article.postType)}
        </Badge>

        {/* Title */}
        <h3 className="h3 md:h2 text-white line-clamp-2 group-hover:text-primary-20 transition-colors">
          {article.title}
        </h3>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="body-sm text-gray-200 line-clamp-1 hidden md:block">
            {article.excerpt}
          </p>
        )}
      </div>
    </Link>
  )
}
