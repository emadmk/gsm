'use client'

import { useMemo } from 'react'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
} from 'lucide-react'

interface SeoAnalyzerProps {
  title: string
  metaTitle: string
  metaDesc: string
  focusKeyword: string
  content: string
  slug: string
}

interface SeoCheck {
  label: string
  status: 'good' | 'warning' | 'bad'
  message: string
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

export default function SeoAnalyzer({
  title,
  metaTitle,
  metaDesc,
  focusKeyword,
  content,
  slug,
}: SeoAnalyzerProps) {
  const checks = useMemo(() => {
    const results: SeoCheck[] = []
    const plainContent = stripHtml(content || '')
    const effectiveTitle = metaTitle || title

    // Title length
    if (!effectiveTitle) {
      results.push({ label: 'عنوان', status: 'bad', message: 'عنوان تعریف نشده است' })
    } else if (effectiveTitle.length < 20) {
      results.push({ label: 'عنوان', status: 'warning', message: 'عنوان خیلی کوتاه است (کمتر از ۲۰ کاراکتر)' })
    } else if (effectiveTitle.length > 70) {
      results.push({ label: 'عنوان', status: 'warning', message: 'عنوان خیلی بلند است (بیشتر از ۷۰ کاراکتر)' })
    } else {
      results.push({ label: 'عنوان', status: 'good', message: `طول عنوان مناسب است (${effectiveTitle.length.toLocaleString('fa-IR')} کاراکتر)` })
    }

    // Meta description
    if (!metaDesc) {
      results.push({ label: 'توضیحات متا', status: 'bad', message: 'توضیحات متا تعریف نشده است' })
    } else if (metaDesc.length < 50) {
      results.push({ label: 'توضیحات متا', status: 'warning', message: 'توضیحات متا خیلی کوتاه است' })
    } else if (metaDesc.length > 160) {
      results.push({ label: 'توضیحات متا', status: 'warning', message: 'توضیحات متا خیلی بلند است (بیشتر از ۱۶۰ کاراکتر)' })
    } else {
      results.push({ label: 'توضیحات متا', status: 'good', message: 'طول توضیحات متا مناسب است' })
    }

    // Focus keyword
    if (!focusKeyword) {
      results.push({ label: 'کلمه کلیدی', status: 'warning', message: 'کلمه کلیدی اصلی مشخص نشده' })
    } else {
      // Keyword in title
      if (effectiveTitle.includes(focusKeyword)) {
        results.push({ label: 'کلمه کلیدی در عنوان', status: 'good', message: 'کلمه کلیدی در عنوان وجود دارد' })
      } else {
        results.push({ label: 'کلمه کلیدی در عنوان', status: 'bad', message: 'کلمه کلیدی در عنوان وجود ندارد' })
      }

      // Keyword in content
      if (plainContent.includes(focusKeyword)) {
        results.push({ label: 'کلمه کلیدی در محتوا', status: 'good', message: 'کلمه کلیدی در محتوا وجود دارد' })
      } else {
        results.push({ label: 'کلمه کلیدی در محتوا', status: 'bad', message: 'کلمه کلیدی در محتوا وجود ندارد' })
      }

      // Keyword in slug
      if (slug && slug.includes(focusKeyword)) {
        results.push({ label: 'کلمه کلیدی در آدرس', status: 'good', message: 'کلمه کلیدی در اسلاگ وجود دارد' })
      } else {
        results.push({ label: 'کلمه کلیدی در آدرس', status: 'warning', message: 'کلمه کلیدی در اسلاگ وجود ندارد' })
      }

      // Keyword in meta desc
      if (metaDesc && metaDesc.includes(focusKeyword)) {
        results.push({ label: 'کلمه کلیدی در توضیحات', status: 'good', message: 'کلمه کلیدی در توضیحات متا وجود دارد' })
      } else {
        results.push({ label: 'کلمه کلیدی در توضیحات', status: 'warning', message: 'کلمه کلیدی در توضیحات متا وجود ندارد' })
      }
    }

    // Content length
    const wordCount = plainContent.split(/\s+/).filter(w => w.length > 0).length
    if (wordCount < 100) {
      results.push({ label: 'طول محتوا', status: 'bad', message: 'محتوا خیلی کوتاه است (کمتر از ۱۰۰ کلمه)' })
    } else if (wordCount < 300) {
      results.push({ label: 'طول محتوا', status: 'warning', message: 'محتوا نسبتا کوتاه است (کمتر از ۳۰۰ کلمه)' })
    } else {
      results.push({ label: 'طول محتوا', status: 'good', message: `طول محتوا مناسب است (${wordCount.toLocaleString('fa-IR')} کلمه)` })
    }

    return results
  }, [title, metaTitle, metaDesc, focusKeyword, content, slug])

  const goodCount = checks.filter(c => c.status === 'good').length
  const totalCount = checks.length
  const score = totalCount > 0 ? Math.round((goodCount / totalCount) * 100) : 0

  const scoreColor = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-red-600'
  const scoreBg = score >= 70 ? 'bg-green-100' : score >= 40 ? 'bg-amber-100' : 'bg-red-100'

  return (
    <div className="space-y-4">
      {/* Score */}
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl ${scoreBg} flex items-center justify-center`}>
          <Search className={`w-5 h-5 ${scoreColor}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold ${scoreColor}`}>
              {score.toLocaleString('fa-IR')}%
            </span>
            <span className="text-sm text-gray-500">امتیاز سئو</span>
          </div>
          <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checks */}
      <div className="space-y-2">
        {checks.map((check, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 text-sm"
          >
            {check.status === 'good' && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />}
            {check.status === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />}
            {check.status === 'bad' && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
            <span className={`${
              check.status === 'good' ? 'text-gray-600' : check.status === 'warning' ? 'text-amber-700' : 'text-red-700'
            }`}>
              {check.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
