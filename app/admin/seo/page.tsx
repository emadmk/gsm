'use client'

import { useEffect, useState, useCallback, useRef, Fragment } from 'react'
import {
  Search,
  Globe,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  Type,
  Hash,
  Eye,
  Pencil,
  X,
  Check,
} from 'lucide-react'

// ==================== Types ====================

interface Article {
  id: number
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  image: string | null
  metaTitle: string | null
  metaDesc: string | null
  canonicalUrl: string | null
  focusKeyword: string | null
  faq: unknown
  postType: string
  status: string
  publishedAt: string | null
  author: { name: string } | null
  category: { name: string } | null
}

interface SeoCheck {
  label: string
  passed: boolean
  detail: string
}

interface ArticleSeoData {
  article: Article
  score: number
  checks: SeoCheck[]
}

// ==================== SEO Scoring Logic ====================

function analyzeSeo(article: Article): { score: number; checks: SeoCheck[] } {
  const checks: SeoCheck[] = []
  const title = article.metaTitle || article.title || ''
  const desc = article.metaDesc || ''
  const keyword = article.focusKeyword || ''
  const content = article.content || ''
  const firstParagraph = content.substring(0, 500)

  // Title length
  const titleLen = title.length
  checks.push({
    label: 'طول عنوان متا (50-60 کاراکتر)',
    passed: titleLen >= 50 && titleLen <= 60,
    detail: titleLen === 0 ? 'عنوان متا تنظیم نشده' : `${titleLen} کاراکتر`,
  })

  // Meta desc length
  const descLen = desc.length
  checks.push({
    label: 'طول توضیحات متا (150-160 کاراکتر)',
    passed: descLen >= 150 && descLen <= 160,
    detail: descLen === 0 ? 'توضیحات متا تنظیم نشده' : `${descLen} کاراکتر`,
  })

  // Focus keyword exists
  checks.push({
    label: 'کلمه کلیدی اصلی تنظیم شده',
    passed: keyword.length > 0,
    detail: keyword.length > 0 ? keyword : 'تنظیم نشده',
  })

  // Keyword in title
  checks.push({
    label: 'کلمه کلیدی در عنوان',
    passed: keyword.length > 0 && title.toLowerCase().includes(keyword.toLowerCase()),
    detail: keyword.length === 0 ? 'کلمه کلیدی تنظیم نشده' : keyword.length > 0 && title.toLowerCase().includes(keyword.toLowerCase()) ? 'موجود' : 'یافت نشد',
  })

  // Keyword in meta desc
  checks.push({
    label: 'کلمه کلیدی در توضیحات متا',
    passed: keyword.length > 0 && desc.toLowerCase().includes(keyword.toLowerCase()),
    detail: keyword.length === 0 ? 'کلمه کلیدی تنظیم نشده' : keyword.length > 0 && desc.toLowerCase().includes(keyword.toLowerCase()) ? 'موجود' : 'یافت نشد',
  })

  // Keyword in first paragraph
  checks.push({
    label: 'کلمه کلیدی در پاراگراف اول',
    passed: keyword.length > 0 && firstParagraph.toLowerCase().includes(keyword.toLowerCase()),
    detail: keyword.length === 0 ? 'کلمه کلیدی تنظیم نشده' : keyword.length > 0 && firstParagraph.toLowerCase().includes(keyword.toLowerCase()) ? 'موجود' : 'یافت نشد',
  })

  // Image alt text
  const hasImage = !!article.image
  const imgAltRegex = /<img[^>]+alt=["'][^"']+["']/i
  const hasAltInContent = imgAltRegex.test(content)
  checks.push({
    label: 'تصویر با متن جایگزین (alt)',
    passed: hasImage || hasAltInContent,
    detail: hasImage ? 'تصویر شاخص موجود' : hasAltInContent ? 'alt در محتوا موجود' : 'بدون تصویر یا alt',
  })

  // Internal links
  const internalLinkRegex = /<a[^>]+href=["']\/[^"']*["']/gi
  const hasInternalLinks = internalLinkRegex.test(content)
  checks.push({
    label: 'لینک‌های داخلی',
    passed: hasInternalLinks,
    detail: hasInternalLinks ? 'موجود' : 'یافت نشد',
  })

  // External links
  const externalLinkRegex = /<a[^>]+href=["']https?:\/\/[^"']*["']/gi
  const hasExternalLinks = externalLinkRegex.test(content)
  checks.push({
    label: 'لینک‌های خارجی',
    passed: hasExternalLinks,
    detail: hasExternalLinks ? 'موجود' : 'یافت نشد',
  })

  // URL structure
  const slugOk = /^[a-z0-9-]+$/.test(article.slug) && article.slug.length < 80
  checks.push({
    label: 'ساختار URL مناسب',
    passed: slugOk,
    detail: slugOk ? 'مناسب' : 'نیاز به بهبود',
  })

  const passed = checks.filter((c) => c.passed).length
  const score = Math.round((passed / checks.length) * 100)

  return { score, checks }
}

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-500'
  return 'text-red-500'
}

function scoreBg(score: number): string {
  if (score >= 70) return 'bg-emerald-50 border-emerald-200'
  if (score >= 40) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

function scoreLabel(score: number): string {
  if (score >= 70) return 'خوب'
  if (score >= 40) return 'نیاز به بهبود'
  return 'ضعیف'
}

// ==================== Component ====================

export default function SeoManagementPage() {
  // Site-wide settings
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState(false)
  const [settingsError, setSettingsError] = useState('')

  // Articles
  const [articles, setArticles] = useState<ArticleSeoData[]>([])
  const [articlesLoading, setArticlesLoading] = useState(true)
  const [totalArticles, setTotalArticles] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [seoFilter, setSeoFilter] = useState<'all' | 'good' | 'needs' | 'poor'>('all')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Expanded row for checklist
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Inline editing
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingCell, setSavingCell] = useState(false)

  // Sections
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Bulk
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // ==================== Fetch Settings ====================

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
          setSettings(data)
        }
      })
      .catch(() => setSettingsError('خطا در دریافت تنظیمات'))
      .finally(() => setSettingsLoading(false))
  }, [])

  // ==================== Fetch Articles ====================

  const fetchArticles = useCallback(async () => {
    setArticlesLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/articles?${params}`)
      const data = await res.json()

      if (data.articles) {
        let analyzed: ArticleSeoData[] = data.articles.map((a: Article) => {
          const { score, checks } = analyzeSeo(a)
          return { article: a, score, checks }
        })

        // Apply SEO filter
        if (seoFilter === 'good') analyzed = analyzed.filter((a) => a.score >= 70)
        else if (seoFilter === 'needs') analyzed = analyzed.filter((a) => a.score >= 40 && a.score < 70)
        else if (seoFilter === 'poor') analyzed = analyzed.filter((a) => a.score < 40)

        setArticles(analyzed)
        setTotalArticles(data.total || 0)
        setTotalPages(data.totalPages || 1)
      }
    } catch {
      // ignore
    } finally {
      setArticlesLoading(false)
    }
  }, [page, searchQuery, seoFilter])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  // ==================== Save Settings ====================

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSettingsSuccess(false)
  }

  const saveSettings = async () => {
    setSettingsSaving(true)
    setSettingsError('')
    setSettingsSuccess(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()
      setSettingsSuccess(true)
    } catch {
      setSettingsError('خطا در ذخیره تنظیمات')
    } finally {
      setSettingsSaving(false)
    }
  }

  // ==================== Inline Edit ====================

  const startEdit = (id: number, field: string, currentValue: string) => {
    setEditingCell({ id, field })
    setEditValue(currentValue || '')
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const saveEdit = async () => {
    if (!editingCell) return
    setSavingCell(true)
    try {
      const res = await fetch(`/api/articles/${editingCell.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [editingCell.field]: editValue }),
      })
      if (res.ok) {
        // Update local state
        setArticles((prev) =>
          prev.map((item) => {
            if (item.article.id === editingCell.id) {
              const updated = { ...item.article, [editingCell.field]: editValue }
              const { score, checks } = analyzeSeo(updated)
              return { article: updated, score, checks }
            }
            return item
          })
        )
        cancelEdit()
      }
    } catch {
      // ignore
    } finally {
      setSavingCell(false)
    }
  }

  // ==================== Search Debounce ====================

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
    }, 400)
  }

  // ==================== Bulk Selection ====================

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === articles.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(articles.map((a) => a.article.id)))
    }
  }

  // ==================== Setting Fields ====================

  const seoSettingFields = [
    { key: 'seo_meta_title_template', label: 'قالب عنوان متا', placeholder: '{title} | نام سایت', type: 'text' },
    { key: 'seo_default_meta_desc', label: 'توضیحات متا پیش‌فرض', placeholder: 'توضیحات پیش‌فرض سایت...', type: 'textarea' },
    { key: 'seo_default_og_image', label: 'تصویر OG پیش‌فرض (URL)', placeholder: 'https://example.com/og-image.jpg', type: 'text' },
    { key: 'seo_robots_txt', label: 'محتوای robots.txt', placeholder: 'User-agent: *\nAllow: /', type: 'textarea' },
    { key: 'seo_sitemap_config', label: 'تنظیمات Sitemap', placeholder: 'فعال / غیرفعال - تنظیمات اضافی', type: 'textarea' },
    { key: 'seo_google_verification', label: 'کد تایید Google Search Console', placeholder: 'google-site-verification=...', type: 'text' },
    { key: 'social_telegram', label: 'لینک تلگرام', placeholder: 'https://t.me/...', type: 'text' },
    { key: 'social_instagram', label: 'لینک اینستاگرام', placeholder: 'https://instagram.com/...', type: 'text' },
    { key: 'social_twitter', label: 'لینک توییتر (X)', placeholder: 'https://x.com/...', type: 'text' },
    { key: 'social_youtube', label: 'لینک یوتیوب', placeholder: 'https://youtube.com/...', type: 'text' },
    { key: 'social_linkedin', label: 'لینک لینکدین', placeholder: 'https://linkedin.com/...', type: 'text' },
  ]

  // ==================== Render ====================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Globe className="w-7 h-7 text-blue-600" />
            مدیریت سئو
          </h1>
          <p className="text-sm text-gray-500 mt-1">تنظیمات سئو سایت و بررسی وضعیت سئوی مقالات</p>
        </div>
        <button
          onClick={fetchArticles}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          بروزرسانی
        </button>
      </div>

      {/* ==================== Site-wide SEO Settings ==================== */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-gray-900">تنظیمات سئوی سایت</h2>
              <p className="text-xs text-gray-500">تنظیمات عمومی سئو، robots.txt، نقشه سایت و شبکه‌های اجتماعی</p>
            </div>
          </div>
          {settingsOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {settingsOpen && (
          <div className="px-6 pb-6 border-t border-gray-100">
            {settingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {seoSettingFields.map((field) => (
                    <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={settings[field.key] || ''}
                          onChange={(e) => handleSettingChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          rows={field.key === 'seo_robots_txt' ? 6 : 3}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-y font-mono"
                          dir="ltr"
                        />
                      ) : (
                        <input
                          type="text"
                          value={settings[field.key] || ''}
                          onChange={(e) => handleSettingChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                          dir={field.key.startsWith('social_') || field.key === 'seo_default_og_image' || field.key === 'seo_google_verification' ? 'ltr' : 'rtl'}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {settingsError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl">
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                    {settingsError}
                  </div>
                )}
                {settingsSuccess && (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 px-4 py-2.5 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    تنظیمات با موفقیت ذخیره شد
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={saveSettings}
                    disabled={settingsSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    ذخیره تنظیمات سئو
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== Article SEO Audit ==================== */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">بررسی سئوی مقالات</h2>
                <p className="text-xs text-gray-500">{totalArticles} مقاله</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="جستجوی عنوان مقاله..."
                className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              {(['all', 'good', 'needs', 'poor'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setSeoFilter(f); setPage(1) }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    seoFilter === f
                      ? f === 'good' ? 'bg-emerald-100 text-emerald-700'
                        : f === 'needs' ? 'bg-amber-100 text-amber-700'
                        : f === 'poor' ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'همه' : f === 'good' ? 'خوب' : f === 'needs' ? 'نیاز به بهبود' : 'ضعیف'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {articlesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">مقاله‌ای یافت نشد</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === articles.length && articles.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">عنوان</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 hidden lg:table-cell">عنوان متا</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 hidden md:table-cell">توضیحات متا</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 hidden lg:table-cell">کلمه کلیدی</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 w-28">امتیاز سئو</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 w-20">جزئیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {articles.map((item) => {
                  const { article, score, checks } = item
                  const isExpanded = expandedId === article.id

                  return (
                    <Fragment key={article.id}>
                      <tr className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(article.id)}
                            onChange={() => toggleSelect(article.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 max-w-[200px] truncate block">{article.title}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5 dir-ltr text-right">{article.slug}</div>
                        </td>
                        {/* Meta Title - inline editable */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {editingCell?.id === article.id && editingCell.field === 'metaTitle' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 px-2 py-1 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                autoFocus
                              />
                              <button onClick={saveEdit} disabled={savingCell} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                                {savingCell ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={cancelEdit} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(article.id, 'metaTitle', article.metaTitle || '')}
                              className="text-right group flex items-center gap-1 max-w-[180px]"
                            >
                              {article.metaTitle ? (
                                <span className="text-gray-700 text-xs truncate">{article.metaTitle}</span>
                              ) : (
                                <span className="text-gray-300 text-xs">تنظیم نشده</span>
                              )}
                              <Pencil className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                            </button>
                          )}
                        </td>
                        {/* Meta Desc status */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          {editingCell?.id === article.id && editingCell.field === 'metaDesc' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 px-2 py-1 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                autoFocus
                              />
                              <button onClick={saveEdit} disabled={savingCell} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                                {savingCell ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={cancelEdit} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(article.id, 'metaDesc', article.metaDesc || '')}
                              className="text-right group flex items-center gap-1"
                            >
                              {article.metaDesc ? (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  article.metaDesc.length >= 150 && article.metaDesc.length <= 160
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {article.metaDesc.length} کاراکتر
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500">خالی</span>
                              )}
                              <Pencil className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                            </button>
                          )}
                        </td>
                        {/* Focus Keyword */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {editingCell?.id === article.id && editingCell.field === 'focusKeyword' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 px-2 py-1 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                                autoFocus
                              />
                              <button onClick={saveEdit} disabled={savingCell} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                                {savingCell ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={cancelEdit} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(article.id, 'focusKeyword', article.focusKeyword || '')}
                              className="text-right group flex items-center gap-1"
                            >
                              {article.focusKeyword ? (
                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{article.focusKeyword}</span>
                              ) : (
                                <span className="text-gray-300 text-xs">تنظیم نشده</span>
                              )}
                              <Pencil className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                            </button>
                          )}
                        </td>
                        {/* Score */}
                        <td className="px-4 py-3 text-center">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${scoreBg(score)}`}>
                            {score >= 70 ? <CheckCircle2 className={`w-3.5 h-3.5 ${scoreColor(score)}`} /> :
                              score >= 40 ? <AlertTriangle className={`w-3.5 h-3.5 ${scoreColor(score)}`} /> :
                              <XCircle className={`w-3.5 h-3.5 ${scoreColor(score)}`} />}
                            <span className={scoreColor(score)}>{score}%</span>
                          </div>
                        </td>
                        {/* Expand */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : article.id)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Checklist */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-gray-50/80">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {checks.map((check, i) => (
                                <div
                                  key={i}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                                    check.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                                  }`}
                                >
                                  {check.passed ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                  )}
                                  <span className="font-medium">{check.label}</span>
                                  <span className="mr-auto text-[11px] opacity-70">{check.detail}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <span className="text-xs text-gray-500">صفحه {page} از {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                قبلی
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                بعدی
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

