'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Brain,
  Loader2,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Code2,
  HelpCircle,
  List,
  Lightbulb,
  Sparkles,
  Search,
  RefreshCw,
  Copy,
  Check,
  Pencil,
  X,
  MessageSquare,
  ClipboardCheck,
  BarChart3,
} from 'lucide-react'

// ==================== Types ====================

interface FaqItem {
  question: string
  answer: string
}

interface Article {
  id: number
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  image: string | null
  metaTitle: string | null
  metaDesc: string | null
  focusKeyword: string | null
  faq: FaqItem[] | null
  postType: string
  status: string
  publishedAt: string | null
  author: { name: string } | null
  category: { name: string } | null
}

interface AeoCheck {
  label: string
  passed: boolean
  detail: string
}

interface ArticleAeoData {
  article: Article
  aeoScore: number
  checks: AeoCheck[]
  suggestedFaqs: string[]
  schemaTypes: string[]
  schemaErrors: string[]
}

// ==================== AEO Analysis ====================

function analyzeAeo(article: Article): Omit<ArticleAeoData, 'article'> {
  const checks: AeoCheck[] = []
  const content = article.content || ''
  const title = article.title || ''
  const faq = Array.isArray(article.faq) ? (article.faq as FaqItem[]) : []

  // Has FAQ section
  const hasFaq = faq.length > 0
  checks.push({
    label: 'بخش سوالات متداول (FAQ)',
    passed: hasFaq,
    detail: hasFaq ? `${faq.length} سوال` : 'ندارد',
  })

  // Clear Q&A format in content
  const hasQaFormat = /(<h[2-4][^>]*>.*\?.*<\/h[2-4]>)/i.test(content) || content.includes('؟')
  checks.push({
    label: 'فرمت پرسش و پاسخ',
    passed: hasQaFormat,
    detail: hasQaFormat ? 'موجود' : 'یافت نشد',
  })

  // Lists/tables
  const hasLists = /<(ul|ol|table)/i.test(content)
  checks.push({
    label: 'لیست یا جدول مقایسه‌ای',
    passed: hasLists,
    detail: hasLists ? 'موجود' : 'یافت نشد',
  })

  // Step-by-step instructions
  const hasSteps = /مرحله|گام|قدم|step/i.test(content) || /<ol/i.test(content)
  checks.push({
    label: 'دستورالعمل مرحله‌ای',
    passed: hasSteps,
    detail: hasSteps ? 'موجود' : 'یافت نشد',
  })

  // Concise definitions
  const hasDefinition = /است\.|می‌باشد\.|تعریف|چیست|what is/i.test(content)
  checks.push({
    label: 'تعریف مختصر و واضح',
    passed: hasDefinition,
    detail: hasDefinition ? 'موجود' : 'یافت نشد',
  })

  // Headings structure
  const headingCount = (content.match(/<h[2-4]/gi) || []).length
  checks.push({
    label: 'ساختار هدینگ مناسب (H2-H4)',
    passed: headingCount >= 3,
    detail: `${headingCount} هدینگ`,
  })

  // Schema/structured data potential
  const hasSchemaMarkers = hasFaq || /<script[^>]+type="application\/ld\+json"/i.test(content)
  checks.push({
    label: 'داده ساختاریافته',
    passed: hasSchemaMarkers,
    detail: hasSchemaMarkers ? 'موجود' : 'ندارد',
  })

  // Content length for snippet
  const textContent = content.replace(/<[^>]+>/g, '')
  const wordCount = textContent.split(/\s+/).filter(Boolean).length
  checks.push({
    label: 'طول محتوا مناسب (بیش از 300 کلمه)',
    passed: wordCount >= 300,
    detail: `${wordCount} کلمه`,
  })

  // Score
  const passed = checks.filter((c) => c.passed).length
  const aeoScore = Math.round((passed / checks.length) * 100)

  // Generate FAQ suggestions from title
  const suggestedFaqs = generateFaqSuggestions(title, article.focusKeyword || '')

  // Detect schema types
  const schemaTypes: string[] = []
  if (hasFaq) schemaTypes.push('FAQPage')
  if (article.postType === 'REVIEW') schemaTypes.push('Review')
  if (article.postType === 'NEWS') schemaTypes.push('NewsArticle')
  if (article.postType === 'ARTICLE') schemaTypes.push('Article')
  if (hasSteps) schemaTypes.push('HowTo')

  // Schema errors
  const schemaErrors: string[] = []
  if (!hasFaq && faq.length === 0) schemaErrors.push('فیلد FAQ خالی است')
  if (!article.metaTitle) schemaErrors.push('عنوان متا تنظیم نشده')
  if (!article.metaDesc) schemaErrors.push('توضیحات متا تنظیم نشده')
  if (!article.image) schemaErrors.push('تصویر شاخص ندارد')

  return { aeoScore, checks, suggestedFaqs, schemaTypes, schemaErrors }
}

function generateFaqSuggestions(title: string, keyword: string): string[] {
  const suggestions: string[] = []
  const subject = keyword || title

  suggestions.push(`${subject} چیست؟`)
  suggestions.push(`مزایای ${subject} چیست؟`)
  suggestions.push(`چگونه از ${subject} استفاده کنیم؟`)
  suggestions.push(`بهترین ${subject} کدام است؟`)
  suggestions.push(`تفاوت ${subject} با رقبا چیست؟`)
  suggestions.push(`قیمت ${subject} چقدر است؟`)

  return suggestions
}

function generateFaqSchema(faqs: FaqItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  }
}

function aeoScoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-500'
  return 'text-red-500'
}

function aeoScoreBg(score: number): string {
  if (score >= 70) return 'bg-emerald-50 border-emerald-200'
  if (score >= 40) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

// ==================== Component ====================

type Tab = 'faq' | 'schema' | 'snippets' | 'tips'

export default function AeoManagementPage() {
  const [articles, setArticles] = useState<ArticleAeoData[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalArticles, setTotalArticles] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('faq')

  // Expanded article
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // FAQ editing
  const [editingFaqId, setEditingFaqId] = useState<number | null>(null)
  const [faqDraft, setFaqDraft] = useState<FaqItem[]>([])
  const [savingFaq, setSavingFaq] = useState(false)
  const [faqSaveSuccess, setFaqSaveSuccess] = useState<number | null>(null)

  // Schema preview
  const [schemaPreviewId, setSchemaPreviewId] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  // ==================== Fetch ====================

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/articles?${params}`)
      const data = await res.json()

      if (data.articles) {
        const analyzed: ArticleAeoData[] = data.articles.map((a: Article) => {
          const analysis = analyzeAeo(a)
          return { article: a, ...analysis }
        })
        setArticles(analyzed)
        setTotalArticles(data.total || 0)
        setTotalPages(data.totalPages || 1)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  // ==================== FAQ Management ====================

  const startFaqEdit = (article: Article) => {
    setEditingFaqId(article.id)
    const existing = Array.isArray(article.faq) ? (article.faq as FaqItem[]) : []
    setFaqDraft([...existing])
  }

  const addFaqItem = () => {
    setFaqDraft((prev) => [...prev, { question: '', answer: '' }])
  }

  const removeFaqItem = (index: number) => {
    setFaqDraft((prev) => prev.filter((_, i) => i !== index))
  }

  const updateFaqItem = (index: number, field: 'question' | 'answer', value: string) => {
    setFaqDraft((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addSuggestedFaq = (question: string) => {
    setFaqDraft((prev) => [...prev, { question, answer: '' }])
  }

  const saveFaq = async (articleId: number) => {
    setSavingFaq(true)
    try {
      const validFaqs = faqDraft.filter((f) => f.question.trim() && f.answer.trim())
      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faq: validFaqs.length > 0 ? validFaqs : null }),
      })
      if (res.ok) {
        setArticles((prev) =>
          prev.map((item) => {
            if (item.article.id === articleId) {
              const updated = { ...item.article, faq: validFaqs.length > 0 ? validFaqs : null }
              const analysis = analyzeAeo(updated)
              return { article: updated, ...analysis }
            }
            return item
          })
        )
        setEditingFaqId(null)
        setFaqSaveSuccess(articleId)
        setTimeout(() => setFaqSaveSuccess(null), 2000)
      }
    } catch {
      // ignore
    } finally {
      setSavingFaq(false)
    }
  }

  // ==================== Copy Schema ====================

  const copySchema = (faqs: FaqItem[]) => {
    const schema = generateFaqSchema(faqs)
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ==================== Tabs ====================

  const tabs: { key: Tab; label: string; icon: typeof Brain }[] = [
    { key: 'faq', label: 'مدیریت FAQ', icon: HelpCircle },
    { key: 'schema', label: 'داده ساختاریافته', icon: Code2 },
    { key: 'snippets', label: 'بهینه‌سازی اسنیپت', icon: Sparkles },
    { key: 'tips', label: 'پیشنهادات محتوا', icon: Lightbulb },
  ]

  // ==================== Render ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Brain className="w-7 h-7 text-purple-600" />
            بهینه‌سازی پاسخ‌گویی هوشمند (AEO)
          </h1>
          <p className="text-sm text-gray-500 mt-1">بهینه‌سازی محتوا برای موتورهای پاسخ‌گوی هوش مصنوعی</p>
        </div>
        <button
          onClick={fetchArticles}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          بروزرسانی
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-purple-500 text-purple-700 bg-purple-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
              placeholder="جستجوی مقاله..."
              className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">مقاله‌ای یافت نشد</div>
        ) : (
          <div>
            {/* ==================== FAQ Tab ==================== */}
            {activeTab === 'faq' && (
              <div className="divide-y divide-gray-50">
                {articles.map((item) => {
                  const { article } = item
                  const faqs = Array.isArray(article.faq) ? (article.faq as FaqItem[]) : []
                  const isEditing = editingFaqId === article.id
                  const isExpanded = expandedId === article.id

                  return (
                    <div key={article.id} className="px-6 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : article.id)}
                            className="p-1 hover:bg-gray-100 rounded-lg"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{article.title}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${faqs.length > 0 ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                                {faqs.length > 0 ? `${faqs.length} سوال` : 'بدون FAQ'}
                              </span>
                              {faqSaveSuccess === article.id && (
                                <span className="text-xs text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> ذخیره شد
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {faqs.length > 0 && (
                            <button
                              onClick={() => setSchemaPreviewId(schemaPreviewId === article.id ? null : article.id)}
                              className="text-xs flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <Code2 className="w-3.5 h-3.5" />
                              Schema
                            </button>
                          )}
                          <button
                            onClick={() => isEditing ? setEditingFaqId(null) : startFaqEdit(article)}
                            className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                              isEditing ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                            }`}
                          >
                            {isEditing ? <><X className="w-3.5 h-3.5" /> انصراف</> : <><Pencil className="w-3.5 h-3.5" /> ویرایش FAQ</>}
                          </button>
                        </div>
                      </div>

                      {/* Schema Preview */}
                      {schemaPreviewId === article.id && faqs.length > 0 && (
                        <div className="mt-3 bg-gray-900 rounded-xl p-4 relative">
                          <button
                            onClick={() => copySchema(faqs)}
                            className="absolute top-3 left-3 text-xs flex items-center gap-1 px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                          >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'کپی شد' : 'کپی'}
                          </button>
                          <pre className="text-xs text-green-400 overflow-x-auto font-mono leading-relaxed" dir="ltr">
                            {JSON.stringify(generateFaqSchema(faqs), null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* FAQ Editor */}
                      {isEditing && (
                        <div className="mt-4 space-y-3 bg-purple-50/30 rounded-xl p-4 border border-purple-100">
                          {faqDraft.map((faqItem, i) => (
                            <div key={i} className="bg-white rounded-xl p-3 border border-gray-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-500">سوال {i + 1}</span>
                                <button onClick={() => removeFaqItem(i)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <input
                                type="text"
                                value={faqItem.question}
                                onChange={(e) => updateFaqItem(i, 'question', e.target.value)}
                                placeholder="سوال را وارد کنید..."
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                              />
                              <textarea
                                value={faqItem.answer}
                                onChange={(e) => updateFaqItem(i, 'answer', e.target.value)}
                                placeholder="پاسخ را وارد کنید..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 resize-y"
                              />
                            </div>
                          ))}

                          {/* Suggestions */}
                          <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100">
                            <p className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1">
                              <Lightbulb className="w-3.5 h-3.5" />
                              پیشنهاد سوالات بر اساس عنوان مقاله:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {item.suggestedFaqs.map((q, i) => (
                                <button
                                  key={i}
                                  onClick={() => addSuggestedFaq(q)}
                                  className="text-xs px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors"
                                >
                                  + {q}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <button
                              onClick={addFaqItem}
                              className="text-xs flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              افزودن سوال
                            </button>
                            <button
                              onClick={() => saveFaq(article.id)}
                              disabled={savingFaq}
                              className="text-xs flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                              {savingFaq ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              ذخیره FAQ
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Existing FAQs (collapsed view) */}
                      {isExpanded && !isEditing && faqs.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {faqs.map((faqItem, i) => (
                            <div key={i} className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                                <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                                {faqItem.question}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 pr-5">{faqItem.answer}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ==================== Schema Tab ==================== */}
            {activeTab === 'schema' && (
              <div className="divide-y divide-gray-50">
                {articles.map((item) => {
                  const { article, schemaTypes, schemaErrors } = item

                  return (
                    <div key={article.id} className="px-6 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{article.title}</h3>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {schemaTypes.map((type) => (
                              <span key={type} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-mono">
                                {type}
                              </span>
                            ))}
                            {schemaTypes.length === 0 && (
                              <span className="text-[11px] text-gray-400">بدون Schema</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {schemaErrors.length > 0 ? (
                            <span className="text-xs flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {schemaErrors.length} هشدار
                            </span>
                          ) : (
                            <span className="text-xs flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              بدون مشکل
                            </span>
                          )}
                        </div>
                      </div>

                      {schemaErrors.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {schemaErrors.map((err, i) => (
                            <span key={i} className="text-[11px] px-2 py-0.5 bg-red-50 text-red-500 rounded-lg flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              {err}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ==================== Snippets Tab ==================== */}
            {activeTab === 'snippets' && (
              <div className="divide-y divide-gray-50">
                {articles.map((item) => {
                  const { article, aeoScore, checks } = item

                  return (
                    <div key={article.id} className="px-6 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border ${aeoScoreBg(aeoScore)}`}>
                            <span className={aeoScoreColor(aeoScore)}>{aeoScore}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{article.title}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {aeoScore >= 70 ? 'آماده برای Featured Snippet' : aeoScore >= 40 ? 'پتانسیل بهبود دارد' : 'نیاز به بهینه‌سازی اساسی'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg"
                        >
                          {expandedId === article.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>
                      </div>

                      {expandedId === article.id && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                          {checks.map((check, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                                check.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                              }`}
                            >
                              {check.passed ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                              <span className="font-medium">{check.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ==================== Tips Tab ==================== */}
            {activeTab === 'tips' && (
              <div className="px-6 py-6 space-y-6">
                {/* General tips */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-100">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    نکات کلی برای بهینه‌سازی AEO
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { icon: HelpCircle, title: 'سوالات متداول (FAQ)', desc: 'برای هر مقاله حداقل 3-5 سوال رایج با پاسخ‌های مختصر و دقیق اضافه کنید.' },
                      { icon: Code2, title: 'داده ساختاریافته', desc: 'از Schema.org استفاده کنید. انواع توصیه شده: FAQPage, HowTo, Article, Review.' },
                      { icon: List, title: 'فرمت لیستی', desc: 'از لیست‌های شماره‌دار و بدون شماره برای مراحل و مقایسه‌ها استفاده کنید.' },
                      { icon: MessageSquare, title: 'پاسخ مستقیم', desc: 'در ابتدای هر بخش، یک جمله خلاصه به عنوان پاسخ مستقیم قرار دهید.' },
                      { icon: ClipboardCheck, title: 'تعاریف واضح', desc: 'برای اصطلاحات تخصصی، تعریف واضح و مختصر در ابتدای محتوا ارائه دهید.' },
                      { icon: BarChart3, title: 'جداول مقایسه', desc: 'برای محتوای مقایسه‌ای از جدول HTML استفاده کنید تا هوش مصنوعی بهتر تحلیل کند.' },
                    ].map((tip, i) => (
                      <div key={i} className="bg-white rounded-lg p-3 border border-white/80 shadow-sm">
                        <div className="flex items-center gap-2 mb-1.5">
                          <tip.icon className="w-4 h-4 text-purple-500" />
                          <span className="text-xs font-bold text-gray-800">{tip.title}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{tip.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Per-article recommendations */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    پیشنهادات اختصاصی هر مقاله
                  </h3>
                  <div className="space-y-2">
                    {articles.map((item) => {
                      const { article, schemaTypes, aeoScore, checks } = item
                      const failedChecks = checks.filter((c) => !c.passed)
                      if (failedChecks.length === 0) return null

                      return (
                        <div key={article.id} className="bg-white border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h4 className="text-sm font-semibold text-gray-900 truncate flex-1">{article.title}</h4>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${aeoScoreBg(aeoScore)} ${aeoScoreColor(aeoScore)}`}>
                              {aeoScore}%
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {failedChecks.map((check, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-red-600">
                                <XCircle className="w-3 h-3 flex-shrink-0" />
                                <span>{check.label}: {check.detail}</span>
                              </div>
                            ))}
                          </div>
                          {schemaTypes.length > 0 && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <span className="text-[11px] text-gray-500">Schema پیشنهادی:</span>
                              {schemaTypes.map((t) => (
                                <span key={t} className="text-[11px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-mono">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {articles.every((a) => a.checks.every((c) => c.passed)) && (
                      <div className="text-center py-8 text-emerald-600 text-sm flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-8 h-8" />
                        همه مقالات بهینه شده‌اند!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <span className="text-xs text-gray-500">صفحه {page} از {totalPages} ({totalArticles} مقاله)</span>
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
