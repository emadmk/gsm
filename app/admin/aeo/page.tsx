'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Bot,
  Search,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  ListChecks,
  Sparkles,
  RefreshCw,
  Save,
  Plus,
  Trash2,
  Eye,
  Code2,
  X,
} from 'lucide-react'

interface Article {
  id: number
  title: string
  slug: string
  postType: string
  metaTitle: string | null
  metaDesc: string | null
  focusKeyword: string | null
  faq: FaqItem[] | null
  content: string | null
  excerpt: string | null
  publishedAt: string | null
}

interface FaqItem {
  question: string
  answer: string
}

type AeoScore = 'excellent' | 'good' | 'needs-work' | 'poor'

interface AeoAnalysis {
  score: number
  level: AeoScore
  checks: AeoCheck[]
}

interface AeoCheck {
  name: string
  description: string
  passed: boolean
  priority: 'high' | 'medium' | 'low'
}

function analyzeArticleForAeo(article: Article): AeoAnalysis {
  const checks: AeoCheck[] = []
  const content = article.content || ''
  const plainText = content.replace(/<[^>]*>/g, '')

  // 1. Has FAQ section
  const hasFaq = article.faq && Array.isArray(article.faq) && article.faq.length > 0
  checks.push({
    name: 'بخش سوالات متداول (FAQ)',
    description: hasFaq ? `${(article.faq as FaqItem[]).length} سوال تعریف شده` : 'بخش FAQ ندارد - برای AI بسیار مهم است',
    passed: !!hasFaq,
    priority: 'high',
  })

  // 2. Has structured headings (h2, h3)
  const hasH2 = /<h2/i.test(content)
  const hasH3 = /<h3/i.test(content)
  checks.push({
    name: 'ساختار سرتیتر (H2/H3)',
    description: hasH2 && hasH3 ? 'سرتیترهای H2 و H3 دارد' : 'سرتیترهای مناسب ندارد',
    passed: hasH2,
    priority: 'high',
  })

  // 3. Has lists (ol/ul)
  const hasLists = /<(ul|ol)/i.test(content)
  checks.push({
    name: 'لیست‌های ساختاریافته',
    description: hasLists ? 'لیست‌های مرتب/نامرتب دارد' : 'لیست ندارد - AI لیست‌ها را ترجیح می‌دهد',
    passed: hasLists,
    priority: 'medium',
  })

  // 4. Has tables
  const hasTables = /<table/i.test(content)
  checks.push({
    name: 'جداول مقایسه‌ای',
    description: hasTables ? 'جدول مقایسه دارد' : 'جدول ندارد - برای محتوای مقایسه‌ای مفید است',
    passed: hasTables,
    priority: 'low',
  })

  // 5. Content length (at least 1000 words)
  const wordCount = plainText.split(/\s+/).filter(Boolean).length
  checks.push({
    name: 'طول محتوا',
    description: `${wordCount.toLocaleString('fa-IR')} کلمه ${wordCount >= 1000 ? '(مناسب)' : '(کمتر از ۱۰۰۰ کلمه)'}`,
    passed: wordCount >= 1000,
    priority: 'medium',
  })

  // 6. Has meta description
  checks.push({
    name: 'توضیح متا',
    description: article.metaDesc ? 'توضیح متا تعریف شده' : 'توضیح متا ندارد',
    passed: !!article.metaDesc,
    priority: 'high',
  })

  // 7. Has focus keyword
  checks.push({
    name: 'کلمه کلیدی اصلی',
    description: article.focusKeyword ? `«${article.focusKeyword}»` : 'کلمه کلیدی تعریف نشده',
    passed: !!article.focusKeyword,
    priority: 'high',
  })

  // 8. Direct answer format (starts with a definition or clear answer)
  const hasDirectAnswer = /^<p>[^<]{20,200}<\/p>/i.test(content.trim())
  checks.push({
    name: 'فرمت پاسخ مستقیم',
    description: hasDirectAnswer ? 'پاراگراف اول پاسخ مستقیم دارد' : 'پاراگراف اول باید پاسخ مستقیم و کوتاه باشد',
    passed: hasDirectAnswer,
    priority: 'high',
  })

  // 9. Has excerpt (concise summary)
  checks.push({
    name: 'خلاصه مطلب',
    description: article.excerpt ? 'خلاصه تعریف شده' : 'خلاصه‌ای تعریف نشده',
    passed: !!article.excerpt,
    priority: 'medium',
  })

  // 10. Question in title
  const questionWords = ['چیست', 'کدام', 'چگونه', 'آیا', 'چرا', 'کجا', 'چند', 'بهترین', 'مقایسه']
  const hasQuestionTitle = questionWords.some(w => article.title.includes(w))
  checks.push({
    name: 'عنوان سوالی/جستجومحور',
    description: hasQuestionTitle ? 'عنوان سوالی دارد' : 'عنوان سوالی ندارد - AI عناوین سوالی را ترجیح می‌دهد',
    passed: hasQuestionTitle,
    priority: 'low',
  })

  const passedCount = checks.filter(c => c.passed).length
  const highPriorityPassed = checks.filter(c => c.priority === 'high' && c.passed).length
  const highPriorityTotal = checks.filter(c => c.priority === 'high').length

  const score = Math.round((passedCount / checks.length) * 100)
  let level: AeoScore = 'poor'
  if (score >= 80 && highPriorityPassed >= highPriorityTotal - 1) level = 'excellent'
  else if (score >= 60) level = 'good'
  else if (score >= 40) level = 'needs-work'

  return { score, level, checks }
}

function getScoreColor(level: AeoScore) {
  switch (level) {
    case 'excellent': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle2 }
    case 'good': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: CheckCircle2 }
    case 'needs-work': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertTriangle }
    case 'poor': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle }
  }
}

function getScoreLabel(level: AeoScore) {
  switch (level) {
    case 'excellent': return 'عالی'
    case 'good': return 'خوب'
    case 'needs-work': return 'نیاز به بهبود'
    case 'poor': return 'ضعیف'
  }
}

export default function AeoPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [filterLevel, setFilterLevel] = useState<AeoScore | 'all'>('all')
  const [editingFaq, setEditingFaq] = useState<{ articleId: number; faqs: FaqItem[] } | null>(null)
  const [savingFaq, setSavingFaq] = useState(false)
  const [schemaPreviewId, setSchemaPreviewId] = useState<number | null>(null)

  const loadArticles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/articles?limit=100&status=PUBLISHED')
      const data = await res.json()
      if (res.ok) {
        setArticles(data.articles || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { loadArticles() }, [loadArticles])

  const filteredArticles = articles.filter(a => {
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterLevel !== 'all') {
      const analysis = analyzeArticleForAeo(a)
      if (analysis.level !== filterLevel) return false
    }
    return true
  })

  const stats = {
    total: articles.length,
    excellent: articles.filter(a => analyzeArticleForAeo(a).level === 'excellent').length,
    good: articles.filter(a => analyzeArticleForAeo(a).level === 'good').length,
    needsWork: articles.filter(a => analyzeArticleForAeo(a).level === 'needs-work').length,
    poor: articles.filter(a => analyzeArticleForAeo(a).level === 'poor').length,
    withFaq: articles.filter(a => a.faq && Array.isArray(a.faq) && a.faq.length > 0).length,
  }

  const handleEditFaq = (article: Article) => {
    const currentFaqs = (article.faq && Array.isArray(article.faq) ? article.faq : []) as FaqItem[]
    setEditingFaq({ articleId: article.id, faqs: [...currentFaqs] })
  }

  const handleSaveFaq = async () => {
    if (!editingFaq) return
    setSavingFaq(true)
    try {
      const res = await fetch(`/api/articles/${editingFaq.articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faq: editingFaq.faqs }),
      })
      if (res.ok) {
        setArticles(prev => prev.map(a =>
          a.id === editingFaq.articleId ? { ...a, faq: editingFaq.faqs } : a
        ))
        setEditingFaq(null)
      }
    } catch { /* ignore */ }
    setSavingFaq(false)
  }

  const generateFaqSchema = (faqs: FaqItem[]) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">بهینه‌سازی AEO</h1>
        <p className="text-sm text-gray-500 mt-1">
          Answer Engine Optimization - بهینه‌سازی محتوا برای تبدیل شدن به منبع پاسخ AI
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'کل مطالب', value: stats.total, color: 'bg-gray-50 border-gray-200 text-gray-700' },
          { label: 'عالی', value: stats.excellent, color: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'خوب', value: stats.good, color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'نیاز به بهبود', value: stats.needsWork, color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'ضعیف', value: stats.poor, color: 'bg-red-50 border-red-200 text-red-700' },
          { label: 'دارای FAQ', value: stats.withFaq, color: 'bg-purple-50 border-purple-200 text-purple-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value.toLocaleString('fa-IR')}</p>
            <p className="text-xs mt-1 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* AEO Tips */}
      <div className="bg-gradient-to-l from-purple-50 to-blue-50 rounded-xl border border-purple-100 p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-gray-800 text-sm">نکات AEO</h3>
            <ul className="mt-2 space-y-1 text-xs text-gray-600">
              <li>- بخش FAQ با سوالات رایج کاربران اضافه کنید</li>
              <li>- پاراگراف اول باید پاسخ مستقیم و کوتاه به سوال اصلی باشد</li>
              <li>- از لیست‌ها و جداول مقایسه‌ای استفاده کنید</li>
              <li>- سرتیترها (H2/H3) را به صورت سوالی بنویسید</li>
              <li>- Schema markup (FAQ, HowTo, Review) را تکمیل کنید</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی مطلب..."
            className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all' as const, label: 'همه' },
            { key: 'excellent' as const, label: 'عالی' },
            { key: 'good' as const, label: 'خوب' },
            { key: 'needs-work' as const, label: 'بهبود' },
            { key: 'poor' as const, label: 'ضعیف' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterLevel(f.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                filterLevel === f.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={loadArticles} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Articles List */}
      <div className="space-y-3">
        {filteredArticles.map(article => {
          const analysis = analyzeArticleForAeo(article)
          const scoreStyle = getScoreColor(analysis.level)
          const isExpanded = expandedId === article.id
          const ScoreIcon = scoreStyle.icon

          return (
            <div key={article.id} className={`bg-white rounded-xl border ${scoreStyle.border} overflow-hidden`}>
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/50 transition"
                onClick={() => setExpandedId(isExpanded ? null : article.id)}
              >
                {/* Score Badge */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${scoreStyle.bg} flex items-center justify-center`}>
                  <span className={`text-lg font-bold ${scoreStyle.text}`}>
                    {analysis.score.toLocaleString('fa-IR')}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 text-sm truncate">{article.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${scoreStyle.text}`}>
                      <ScoreIcon className="w-3.5 h-3.5" />
                      {getScoreLabel(analysis.level)}
                    </span>
                    {article.faq && Array.isArray(article.faq) && article.faq.length > 0 && (
                      <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                        {(article.faq as FaqItem[]).length} FAQ
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditFaq(article) }}
                    className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition"
                    title="ویرایش FAQ"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSchemaPreviewId(schemaPreviewId === article.id ? null : article.id) }}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                    title="پیش‌نمایش Schema"
                  >
                    <Code2 className="w-4 h-4" />
                  </button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {/* Expanded Checks */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <ListChecks className="w-4 h-4" />
                    چک‌لیست AEO
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {analysis.checks.map((check, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-2.5 p-3 rounded-lg ${
                          check.passed ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        {check.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`text-xs font-medium ${check.passed ? 'text-green-700' : 'text-red-700'}`}>
                            {check.name}
                            {check.priority === 'high' && !check.passed && (
                              <span className="mr-1 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">مهم</span>
                            )}
                          </p>
                          <p className={`text-[11px] mt-0.5 ${check.passed ? 'text-green-600' : 'text-red-500'}`}>
                            {check.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schema Preview */}
              {schemaPreviewId === article.id && article.faq && Array.isArray(article.faq) && (article.faq as FaqItem[]).length > 0 && (
                <div className="border-t border-gray-100 p-4 bg-slate-50">
                  <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Code2 className="w-4 h-4" />
                    پیش‌نمایش FAQ Schema
                  </h4>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs overflow-x-auto leading-5" dir="ltr">
                    {JSON.stringify(generateFaqSchema(article.faq as FaqItem[]), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* FAQ Editor Modal */}
      {editingFaq && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingFaq(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">ویرایش سوالات متداول (FAQ)</h3>
              <button onClick={() => setEditingFaq(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {editingFaq.faqs.map((faq, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400">سوال {(idx + 1).toLocaleString('fa-IR')}</span>
                    <button
                      onClick={() => {
                        const updated = editingFaq.faqs.filter((_, i) => i !== idx)
                        setEditingFaq({ ...editingFaq, faqs: updated })
                      }}
                      className="p-1 text-red-400 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    value={faq.question}
                    onChange={(e) => {
                      const updated = [...editingFaq.faqs]
                      updated[idx] = { ...updated[idx], question: e.target.value }
                      setEditingFaq({ ...editingFaq, faqs: updated })
                    }}
                    placeholder="سوال..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <textarea
                    value={faq.answer}
                    onChange={(e) => {
                      const updated = [...editingFaq.faqs]
                      updated[idx] = { ...updated[idx], answer: e.target.value }
                      setEditingFaq({ ...editingFaq, faqs: updated })
                    }}
                    placeholder="پاسخ..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
              ))}

              <button
                onClick={() => {
                  setEditingFaq({
                    ...editingFaq,
                    faqs: [...editingFaq.faqs, { question: '', answer: '' }],
                  })
                }}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:text-blue-600 hover:border-blue-300 transition"
              >
                <Plus className="w-4 h-4" />
                افزودن سوال جدید
              </button>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingFaq(null)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveFaq}
                disabled={savingFaq}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60"
              >
                {savingFaq ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                ذخیره FAQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
