'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { ArticleForm } from '../new/page'

interface ArticleData {
  id: number
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  image: string | null
  imageCaption: string | null
  postType: 'NEWS' | 'ARTICLE' | 'REVIEW' | 'STORY'
  status: 'DRAFT' | 'PUBLISHED'
  authorId: number | null
  categoryId: number | null
  metaTitle: string | null
  metaDesc: string | null
  canonicalUrl: string | null
  focusKeyword: string | null
  featured: boolean
  faq: Array<{ question: string; answer: string }> | null
  points: { positive?: string[]; negative?: string[] } | null
  tags: Array<{ tagId: number; tag: { id: number; name: string } }>
}

export default function EditArticlePage() {
  const params = useParams()
  const articleId = parseInt(params.id as string)

  const [article, setArticle] = useState<ArticleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isNaN(articleId)) {
      setError('شناسه مطلب نامعتبر است')
      setLoading(false)
      return
    }

    fetch(`/api/articles/${articleId}`)
      .then((res) => {
        if (!res.ok) throw new Error('مطلب یافت نشد')
        return res.json()
      })
      .then((data) => {
        setArticle(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [articleId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="text-center text-red-500 py-10">
        {error || 'خطا در بارگذاری مطلب'}
      </div>
    )
  }

  const initialData = {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt || '',
    content: article.content || '',
    image: article.image || '',
    imageCaption: article.imageCaption || '',
    postType: article.postType,
    status: article.status,
    authorId: article.authorId,
    categoryId: article.categoryId,
    tagIds: article.tags?.map((t) => t.tagId) || [],
    metaTitle: article.metaTitle || '',
    metaDesc: article.metaDesc || '',
    canonicalUrl: article.canonicalUrl || '',
    focusKeyword: article.focusKeyword || '',
    featured: article.featured,
    faq: article.faq || [],
    points: article.points || { positive: [], negative: [] },
  }

  return <ArticleForm articleId={articleId} initialData={initialData} />
}
