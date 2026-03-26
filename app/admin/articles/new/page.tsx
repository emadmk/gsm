'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Send,
  FileText,
  Image as ImageIcon,
  Tag,
  Search,
  Calendar,
  User,
  FolderOpen,
} from 'lucide-react'
import RichTextEditor from '@/components/admin/RichTextEditor'
import MediaUpload from '@/components/admin/MediaUpload'
import SeoAnalyzer from '@/components/admin/SeoAnalyzer'

const articleSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  slug: z.string().min(1, 'اسلاگ الزامی است'),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  image: z.string().optional(),
  imageCaption: z.string().optional(),
  postType: z.enum(['NEWS', 'ARTICLE', 'REVIEW', 'STORY']),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  publishedAt: z.string().optional(),
  authorId: z.number().int().nullable().optional(),
  categoryId: z.number().int().nullable().optional(),
  tagIds: z.array(z.number().int()).optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  canonicalUrl: z.string().optional(),
  focusKeyword: z.string().optional(),
  featured: z.boolean().optional(),
  faq: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .optional(),
  points: z
    .object({
      positive: z.array(z.string()).optional(),
      negative: z.array(z.string()).optional(),
    })
    .optional(),
})

type ArticleFormData = z.infer<typeof articleSchema>

interface Category {
  id: number
  name: string
  parentId: number | null
}

interface Tag {
  id: number
  name: string
}

interface Author {
  id: number
  name: string
}

function slugify(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\-]/g, '')
    .toLowerCase()
}

function countWords(text: string): number {
  if (!text) return 0
  return text
    .replace(/<[^>]*>/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0).length
}

function estimateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200))
}

export default function NewArticlePage() {
  return <ArticleForm />
}

export function ArticleForm({
  articleId,
  initialData,
}: {
  articleId?: number
  initialData?: ArticleFormData & { tagIds?: number[] }
} = {}) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showSeo, setShowSeo] = useState(false)
  const [showFaq, setShowFaq] = useState(false)
  const [showPoints, setShowPoints] = useState(false)
  const [tagSearch, setTagSearch] = useState('')

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: initialData || {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      image: '',
      imageCaption: '',
      postType: 'NEWS',
      status: 'DRAFT',
      publishedAt: '',
      authorId: null,
      categoryId: null,
      tagIds: [],
      metaTitle: '',
      metaDesc: '',
      canonicalUrl: '',
      focusKeyword: '',
      featured: false,
      faq: [],
      points: { positive: [], negative: [] },
    },
  })

  const {
    fields: faqFields,
    append: appendFaq,
    remove: removeFaq,
  } = useFieldArray({
    control,
    name: 'faq',
  })

  const title = watch('title')
  const slug = watch('slug')
  const content = watch('content')
  const postType = watch('postType')
  const statusVal = watch('status')
  const metaTitle = watch('metaTitle')
  const metaDesc = watch('metaDesc')
  const focusKeyword = watch('focusKeyword')
  const excerpt = watch('excerpt')

  const wordCount = countWords(content || '')
  const readingTime = estimateReadingTime(wordCount)

  // Auto-generate slug from title
  useEffect(() => {
    if (!articleId && title) {
      setValue('slug', slugify(title))
    }
  }, [title, setValue, articleId])

  // Load categories, tags, authors
  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/tags').then((r) => r.json()),
      fetch('/api/authors').then((r) => r.json()),
    ]).then(([cats, tgs, auths]) => {
      setCategories(Array.isArray(cats) ? cats : [])
      setTags(Array.isArray(tgs) ? tgs : [])
      setAuthors(Array.isArray(auths) ? auths : [])
    })
  }, [])

  // Points management for reviews
  const [positivePoint, setPositivePoint] = useState('')
  const [negativePoint, setNegativePoint] = useState('')
  const points = watch('points')

  const addPositivePoint = useCallback(() => {
    if (!positivePoint.trim()) return
    const current = points?.positive || []
    setValue('points', {
      ...points,
      positive: [...current, positivePoint.trim()],
    })
    setPositivePoint('')
  }, [positivePoint, points, setValue])

  const addNegativePoint = useCallback(() => {
    if (!negativePoint.trim()) return
    const current = points?.negative || []
    setValue('points', {
      ...points,
      negative: [...current, negativePoint.trim()],
    })
    setNegativePoint('')
  }, [negativePoint, points, setValue])

  const removePositivePoint = (index: number) => {
    const current = points?.positive || []
    setValue('points', {
      ...points,
      positive: current.filter((_, i) => i !== index),
    })
  }

  const removeNegativePoint = (index: number) => {
    const current = points?.negative || []
    setValue('points', {
      ...points,
      negative: current.filter((_, i) => i !== index),
    })
  }

  const onSubmit = async (data: ArticleFormData) => {
    setSaving(true)
    setError('')

    try {
      const payload = {
        ...data,
        wordCount,
        readingTime,
        authorId: data.authorId || undefined,
        categoryId: data.categoryId || undefined,
      }

      const url = articleId ? `/api/articles/${articleId}` : '/api/articles'
      const method = articleId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'خطا در ذخیره مطلب')
      }

      const result = await res.json()
      router.push(`/admin/articles/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره مطلب')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDraft = () => {
    setValue('status', 'DRAFT')
    handleSubmit(onSubmit)()
  }

  const handlePublish = () => {
    setValue('status', 'PUBLISHED')
    handleSubmit(onSubmit)()
  }

  // Tag selection
  const selectedTagIds = watch('tagIds') || []
  const toggleTag = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      setValue(
        'tagIds',
        selectedTagIds.filter((id) => id !== tagId)
      )
    } else {
      setValue('tagIds', [...selectedTagIds, tagId])
    }
  }

  const filteredTags = tags.filter((t) =>
    !tagSearch || t.name.includes(tagSearch)
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">
          {articleId ? 'ویرایش مطلب' : 'مطلب جدید'}
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {saving && statusVal === 'DRAFT' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            ذخیره پیش‌نویس
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-500/25"
          >
            {saving && statusVal === 'PUBLISHED' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            انتشار
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Main Content - 70% */}
        <div className="lg:col-span-7 space-y-6">
          {/* Title */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <input
              {...register('title')}
              className="w-full text-2xl font-bold text-gray-800 placeholder-gray-300 outline-none border-0 bg-transparent"
              placeholder="عنوان مطلب را وارد کنید..."
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-2">
                {errors.title.message}
              </p>
            )}

            {/* Slug */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <label className="text-xs font-medium text-gray-400 mb-1 block">
                اسلاگ (آدرس)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0" dir="ltr">/</span>
                <input
                  {...register('slug')}
                  className="w-full text-sm text-gray-600 placeholder-gray-300 outline-none border-0 bg-transparent"
                  placeholder="slug-url"
                  dir="ltr"
                />
              </div>
              {errors.slug && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.slug.message}
                </p>
              )}
            </div>
          </div>

          {/* Content Editor */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                محتوا
              </label>
              <div className="flex gap-3 text-xs text-gray-400">
                <span>{wordCount.toLocaleString('fa-IR')} کلمه</span>
                <span>زمان مطالعه: {readingTime.toLocaleString('fa-IR')} دقیقه</span>
              </div>
            </div>
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              خلاصه مطلب
            </label>
            <textarea
              {...register('excerpt')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y bg-gray-50/50 placeholder-gray-300"
              placeholder="خلاصه کوتاهی از مطلب بنویسید. این متن در لیست مطالب نمایش داده می‌شود..."
            />
          </div>

          {/* SEO Section */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSeo(!showSeo)}
              className="flex items-center justify-between w-full px-6 py-5 hover:bg-gray-50/50 transition-colors"
            >
              <span className="font-semibold text-gray-700 flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                تنظیمات سئو
              </span>
              {showSeo ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {showSeo && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-5 space-y-5">
                {/* SEO Analyzer */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <SeoAnalyzer
                    title={title || ''}
                    metaTitle={metaTitle || ''}
                    metaDesc={metaDesc || ''}
                    focusKeyword={focusKeyword || ''}
                    content={content || ''}
                    slug={slug || ''}
                    excerpt={excerpt || ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    کلمه کلیدی اصلی
                  </label>
                  <input
                    {...register('focusKeyword')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50/50"
                    placeholder="کلمه کلیدی هدف"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    عنوان متا
                  </label>
                  <input
                    {...register('metaTitle')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50/50"
                    placeholder="عنوان برای موتورهای جستجو"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {(metaTitle || '').length.toLocaleString('fa-IR')} / ۷۰ کاراکتر
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    توضیحات متا
                  </label>
                  <textarea
                    {...register('metaDesc')}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y bg-gray-50/50"
                    placeholder="توضیحات کوتاه برای موتورهای جستجو"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {(metaDesc || '').length.toLocaleString('fa-IR')} / ۱۶۰ کاراکتر
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    لینک کنونیکال
                  </label>
                  <input
                    {...register('canonicalUrl')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50/50"
                    placeholder="https://..."
                    dir="ltr"
                  />
                </div>

                {/* SERP Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    پیش‌نمایش نتایج گوگل
                  </label>
                  <div className="bg-white border border-gray-200 rounded-xl p-4" dir="ltr">
                    <div className="text-blue-800 text-lg font-normal leading-tight mb-1 truncate">
                      {metaTitle || title || 'عنوان مطلب'}
                    </div>
                    <div className="text-green-700 text-sm mb-1 truncate">
                      example.com/{slug || 'slug'}
                    </div>
                    <div className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                      {metaDesc || 'توضیحات متا اینجا نمایش داده می‌شود...'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowFaq(!showFaq)}
              className="flex items-center justify-between w-full px-6 py-5 hover:bg-gray-50/50 transition-colors"
            >
              <span className="font-semibold text-gray-700">
                سوالات متداول (FAQ)
              </span>
              {showFaq ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {showFaq && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-5 space-y-4">
                {faqFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">
                        سوال {(index + 1).toLocaleString('fa-IR')}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFaq(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      {...register(`faq.${index}.question`)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                      placeholder="سوال"
                    />
                    <textarea
                      {...register(`faq.${index}.answer`)}
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y bg-white"
                      placeholder="پاسخ"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    appendFaq({ question: '', answer: '' })
                  }
                  className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/30 transition-all w-full justify-center"
                >
                  <Plus className="w-4 h-4" />
                  افزودن سوال جدید
                </button>
              </div>
            )}
          </div>

          {/* Points Section (for Reviews) */}
          {postType === 'REVIEW' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowPoints(!showPoints)}
                className="flex items-center justify-between w-full px-6 py-5 hover:bg-gray-50/50 transition-colors"
              >
                <span className="font-semibold text-gray-700">
                  نقاط قوت و ضعف
                </span>
                {showPoints ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {showPoints && (
                <div className="px-6 pb-6 border-t border-gray-100 pt-5 space-y-6">
                  {/* Positive points */}
                  <div>
                    <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                      نقاط قوت
                    </h4>
                    <div className="space-y-2 mb-3">
                      {(points?.positive || []).map((point, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-green-50 px-4 py-2.5 rounded-xl border border-green-100"
                        >
                          <span className="flex-1 text-sm text-green-800">{point}</span>
                          <button
                            type="button"
                            onClick={() => removePositivePoint(index)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={positivePoint}
                        onChange={(e) => setPositivePoint(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addPositivePoint()
                          }
                        }}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-gray-50/50"
                        placeholder="نقطه قوت جدید..."
                      />
                      <button
                        type="button"
                        onClick={addPositivePoint}
                        className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Negative points */}
                  <div>
                    <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full" />
                      نقاط ضعف
                    </h4>
                    <div className="space-y-2 mb-3">
                      {(points?.negative || []).map((point, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100"
                        >
                          <span className="flex-1 text-sm text-red-800">{point}</span>
                          <button
                            type="button"
                            onClick={() => removeNegativePoint(index)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={negativePoint}
                        onChange={(e) => setNegativePoint(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addNegativePoint()
                          }
                        }}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-gray-50/50"
                        placeholder="نقطه ضعف جدید..."
                      />
                      <button
                        type="button"
                        onClick={addNegativePoint}
                        className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - 30% - Sticky */}
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-20 space-y-5">
            {/* Publish Box */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-800">انتشار</h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    وضعیت
                  </label>
                  <select
                    {...register('status')}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50/50"
                  >
                    <option value="DRAFT">پیش‌نویس</option>
                    <option value="PUBLISHED">منتشر شده</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    تاریخ انتشار
                  </label>
                  <input
                    type="datetime-local"
                    {...register('publishedAt')}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50/50"
                    dir="ltr"
                  />
                </div>

                <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    {...register('featured')}
                    id="featured"
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="featured"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    مطلب ویژه
                  </label>
                </div>
              </div>
              <div className="px-5 pb-5 flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  پیش‌نویس
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-500/25"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  انتشار
                </button>
              </div>
            </div>

            {/* Post Type */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                نوع مطلب
              </label>
              <select
                {...register('postType')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50/50"
              >
                <option value="NEWS">خبر</option>
                <option value="ARTICLE">مقاله</option>
                <option value="REVIEW">بررسی</option>
                <option value="STORY">استوری</option>
              </select>
            </div>

            {/* Category */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                <FolderOpen className="w-3.5 h-3.5" />
                دسته‌بندی
              </label>
              <select
                {...register('categoryId', {
                  setValueAs: (v) => (v ? parseInt(v) : null),
                })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50/50"
              >
                <option value="">بدون دسته‌بندی</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parentId ? '--- ' : ''}
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Author */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                نویسنده
              </label>
              <select
                {...register('authorId', {
                  setValueAs: (v) => (v ? parseInt(v) : null),
                })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50/50"
              >
                <option value="">بدون نویسنده</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured Image */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="block text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                تصویر شاخص
              </label>
              <Controller
                name="image"
                control={control}
                render={({ field }) => (
                  <MediaUpload
                    value={field.value}
                    onChange={field.onChange}
                    label=""
                  />
                )}
              />
              <div className="mt-3">
                <input
                  {...register('imageCaption')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50/50"
                  placeholder="کپشن تصویر"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="block text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                تگ‌ها
              </label>

              {/* Selected tags */}
              {selectedTagIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedTagIds.map((tagId) => {
                    const tag = tags.find((t) => t.id === tagId)
                    if (!tag) return null
                    return (
                      <span
                        key={tagId}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium"
                      >
                        {tag.name}
                        <button
                          type="button"
                          onClick={() => toggleTag(tagId)}
                          className="text-blue-400 hover:text-blue-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Tag search */}
              <div className="relative mb-2">
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="جستجوی تگ..."
                  className="w-full pr-8 pl-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50/50"
                />
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-2">
                {filteredTags.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">تگی یافت نشد</p>
                )}
                {filteredTags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                      className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-700">{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
