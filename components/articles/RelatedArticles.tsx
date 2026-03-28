import ArticleCard from './ArticleCard'
import type { ArticleCardArticle } from './ArticleCard'
import { cn } from '@/lib/utils'

interface RelatedArticlesProps {
  articles: ArticleCardArticle[]
  title?: string
  className?: string
}

export default function RelatedArticles({
  articles,
  title = 'مطالب مرتبط',
  className,
}: RelatedArticlesProps) {
  if (!articles || articles.length === 0) return null

  return (
    <section className={cn('mt-8', className)} dir="rtl">
      <h2 className="h3 text-gray-900 mb-4">{title}</h2>
      <div className="space-y-4">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  )
}
