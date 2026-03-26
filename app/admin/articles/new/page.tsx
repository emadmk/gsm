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
} from 'lucide-react'
import RichTextEditor from '@/components/admin/RichTextEditor'
import MediaUpload from '@/components/admin/MediaUpload'

const articleSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  slug: z.string().min(1, 'اسلاگ الزامی است'),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  image: z.string().optional(),
  imageCaption: z.string().optional(),
  postType: z.enum(['NEWS', 'ARTICLE', 'REVIEW', 'STORY']),
  status: z.enum(['DRAFT', 'PUBLISHED']),
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
  const content = watch('content')
  const postType = watch('postType')

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          {articleId ? 'ویرایش مطلب' : 'مطلب جدید'}
        </h1>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          ذخیره
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Slug */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                عنوان *
              </label>
              <input
                {...register('title')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="عنوان مطلب"
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسلاگ *
              </label>
              <input
                {...register('slug')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="slug-url"
                dir="ltr"
              />
              {errors.slug && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.slug.message}
                </p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              محتوا
            </label>
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
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span>{wordCount.toLocaleString('fa-IR')} کلمه</span>
              <span>
                زمان مطالعه: {readingTime.toLocaleString('fa-IR')} دقیقه
              </span>
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              خلاصه
            </label>
            <textarea
              {...register('excerpt')}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
              placeholder="خلاصه کوتاه مطلب..."
            />
          </div>

          {/* SEO Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSeo(!showSeo)}
              className="flex items-center justify-between w-full p-5 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-800">
                تنظیمات سئو
              </span>
              {showSeo ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {showSeo && (
              <div className="p-5 border-t border-gray-200 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    عنوان متا
                  </label>
                  <input
                    {...register('metaTitle')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="عنوان برای موتورهای جستجو"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    توضیحات متا
                  </label>
                  <textarea
                    {...register('metaDesc')}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
                    placeholder="توضیحات کوتاه برای موتورهای جستجو"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    کلمه کلیدی اصلی
                  </label>
                  <input
                    {...register('focusKeyword')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="کلمه کلیدی هدف"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    لینک کنونیکال
                  </label>
                  <input
                    {...register('canonicalUrl')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="https://..."
                    dir="ltr"
                  />
                </div>
              </div>
            )}
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowFaq(!showFaq)}
              className="flex items-center justify-between w-full p-5 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-800">
                سوالات متداول (FAQ)
              </span>
              {showFaq ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {showFaq && (
              <div className="p-5 border-t border-gray-200 space-y-4">
                {faqFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        سوال {(index + 1).toLocaleString('fa-IR')}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFaq(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      {...register(`faq.${index}.question`)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="سوال"
                    />
                    <textarea
                      {...register(`faq.${index}.answer`)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
                      placeholder="پاسخ"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    appendFaq({ question: '', answer: '' })
                  }
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center"
                >
                  <Plus className="w-4 h-4" />
                  افزودن سوال
                </button>
              </div>
            )}
          </div>

          {/* Points Section (for Reviews) */}
          {postType === 'REVIEW' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowPoints(!showPoints)}
                className="flex items-center justify-between w-full p-5 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-800">
                  نقاط قوت و ضعف
                </span>
                {showPoints ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {showPoints && (
                <div className="p-5 border-t border-gray-200 space-y-6">
                  {/* Positive points */}
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-3">
                      نقاط قوت
                    </h4>
                    <div className="space-y-2 mb-3">
                      {(points?.positive || []).map((point, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg"
                        >
                          <span className="flex-1 text-sm">{point}</span>
                          <button
                            type="button"
                            onClick={() => removePositivePoint(index)}
                            className="text-red-500 hover:text-red-700"
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        placeholder="نقطه قوت جدید..."
                      />
                      <button
                        type="button"
                        onClick={addPositivePoint}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Negative points */}
                  <div>
                    <h4 className="text-sm font-medium text-red-700 mb-3">
                      نقاط ضعف
                    </h4>
                    <div className="space-y-2 mb-3">
                      {(points?.negative || []).map((point, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg"
                        >
                          <span className="flex-1 text-sm">{point}</span>
                          <button
                            type="button"
                            onClick={() => removeNegativePoint(index)}
                            className="text-red-500 hover:text-red-700"
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                        placeholder="نقطه ضعف جدید..."
                      />
                      <button
                        type="button"
                        onClick={addNegativePoint}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
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

        {/* Sidebar - Right 1/3 */}
        <div className="space-y-6">
          {/* Status & Type */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع مطلب
              </label>
              <select
                {...register('postType')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="NEWS">خبر</option>
                <option value="ARTICLE">مقاله</option>
                <option value="REVIEW">بررسی</option>
                <option value="STORY">استوری</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                وضعیت
              </label>
              <select
                {...register('status')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="DRAFT">پیش‌نویس</option>
                <option value="PUBLISHED">منتشر شده</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('featured')}
                id="featured"
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label
                htmlFor="featured"
                className="text-sm font-medium text-gray-700"
              >
                مطلب ویژه
              </label>
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <Controller
              name="image"
              control={control}
              render={({ field }) => (
                <MediaUpload
                  value={field.value}
                  onChange={field.onChange}
                  label="تصویر شاخص"
                />
              )}
            />
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                کپشن تصویر
              </label>
              <input
                {...register('imageCaption')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="توضیح تصویر"
              />
            </div>
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              دسته‌بندی
            </label>
            <select
              {...register('categoryId', {
                setValueAs: (v) => (v ? parseInt(v) : null),
              })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              نویسنده
            </label>
            <select
              {...register('authorId', {
                setValueAs: (v) => (v ? parseInt(v) : null),
              })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">بدون نویسنده</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تگ‌ها
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-200 rounded-lg p-3">
              {tags.length === 0 && (
                <p className="text-xs text-gray-400">تگی وجود ندارد</p>
              )}
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTagIds.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{tag.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
