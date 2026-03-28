'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Search,
  Monitor,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  MinusCircle,
  Eye,
  Type,
  FileText,
  Link2,
  Globe,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SeoAnalyzerProps {
  title: string
  metaTitle: string
  metaDesc: string
  focusKeyword: string
  content: string
  slug: string
  excerpt: string
}

type CheckStatus = 'good' | 'ok' | 'bad'

interface CheckResult {
  id: string
  status: CheckStatus
  message: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function wordCount(text: string): number {
  const clean = stripHtml(text)
  if (!clean) return 0
  return clean.split(/\s+/).filter(Boolean).length
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0
  const lower = haystack.toLowerCase()
  const nLower = needle.toLowerCase()
  let count = 0
  let pos = 0
  while ((pos = lower.indexOf(nLower, pos)) !== -1) {
    count++
    pos += nLower.length
  }
  return count
}

function keywordDensity(content: string, keyword: string): number {
  if (!keyword || !content) return 0
  const words = wordCount(content)
  if (words === 0) return 0
  const kwWords = keyword.trim().split(/\s+/).length
  const occ = countOccurrences(stripHtml(content), keyword)
  return (occ * kwWords * 100) / words
}

function getSentences(text: string): string[] {
  const clean = stripHtml(text)
  return clean
    .split(/[.!?؟۔。।]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function getParagraphs(html: string): string[] {
  const blocks = html.split(/<\/p>|<br\s*\/?>|\n\n/i)
  return blocks
    .map((b) => stripHtml(b).trim())
    .filter(Boolean)
}

function getFirstParagraph(html: string): string {
  const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  if (match) return stripHtml(match[1])
  const paragraphs = getParagraphs(html)
  return paragraphs[0] || ''
}

function hasHeadingWithKeyword(html: string, keyword: string): boolean {
  if (!keyword) return false
  const headingRegex = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi
  let match
  while ((match = headingRegex.exec(html)) !== null) {
    if (stripHtml(match[1]).toLowerCase().includes(keyword.toLowerCase())) {
      return true
    }
  }
  return false
}

function hasImages(html: string): boolean {
  return /<img\s/i.test(html)
}

function imagesHaveAlt(html: string): { total: number; withAlt: number } {
  const imgRegex = /<img\s[^>]*>/gi
  const imgs = html.match(imgRegex) || []
  const total = imgs.length
  const withAlt = imgs.filter((img) => /alt\s*=\s*"[^"]+"/i.test(img)).length
  return { total, withAlt }
}

function hasInternalLinks(html: string): boolean {
  const linkRegex = /<a\s[^>]*href\s*=\s*["']([^"']*)["'][^>]*>/gi
  let match
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]
    if (
      href.startsWith('/') ||
      href.startsWith('#') ||
      (!href.startsWith('http') && !href.startsWith('//'))
    ) {
      return true
    }
  }
  return false
}

function hasExternalLinks(html: string): boolean {
  const linkRegex = /<a\s[^>]*href\s*=\s*["']([^"']*)["'][^>]*>/gi
  let match
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]
    if (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('//')
    ) {
      return true
    }
  }
  return false
}

/** Basic Persian passive voice heuristic */
function countPassiveSentences(text: string): number {
  const sentences = getSentences(text)
  const passivePatterns = [
    /شده/,
    /می‌شود/,
    /میشود/,
    /گردید/,
    /می‌گردد/,
    /میگردد/,
    /شد$/,
    /گشت/,
  ]
  let count = 0
  for (const s of sentences) {
    if (passivePatterns.some((p) => p.test(s))) count++
  }
  return count
}

// ---------------------------------------------------------------------------
// SEO Check Runners
// ---------------------------------------------------------------------------

function runTitleChecks(
  metaTitle: string,
  title: string,
  keyword: string
): CheckResult[] {
  const checks: CheckResult[] = []
  const effectiveTitle = metaTitle || title
  const len = effectiveTitle.length

  // Keyword in title
  if (keyword) {
    const has = effectiveTitle.toLowerCase().includes(keyword.toLowerCase())
    checks.push({
      id: 'title-keyword',
      status: has ? 'good' : 'bad',
      message: has
        ? 'کلمه کلیدی در عنوان وجود دارد.'
        : 'کلمه کلیدی در عنوان یافت نشد.',
    })
  }

  // Title length
  if (len === 0) {
    checks.push({
      id: 'title-length',
      status: 'bad',
      message: 'عنوان تنظیم نشده است.',
    })
  } else if (len >= 50 && len <= 60) {
    checks.push({
      id: 'title-length',
      status: 'good',
      message: `طول عنوان مناسب است (${len} کاراکتر).`,
    })
  } else if ((len >= 30 && len < 50) || (len > 60 && len <= 70)) {
    checks.push({
      id: 'title-length',
      status: 'ok',
      message: `طول عنوان قابل بهبود است (${len} کاراکتر). بهتر است بین ۵۰ تا ۶۰ کاراکتر باشد.`,
    })
  } else {
    checks.push({
      id: 'title-length',
      status: 'bad',
      message: `طول عنوان نامناسب است (${len} کاراکتر). بهتر است بین ۵۰ تا ۶۰ کاراکتر باشد.`,
    })
  }

  // Title starts with keyword
  if (keyword && effectiveTitle) {
    const starts = effectiveTitle
      .toLowerCase()
      .trim()
      .startsWith(keyword.toLowerCase().trim())
    checks.push({
      id: 'title-starts-keyword',
      status: starts ? 'good' : 'ok',
      message: starts
        ? 'عنوان با کلمه کلیدی شروع می‌شود. عالی!'
        : 'عنوان با کلمه کلیدی شروع نمی‌شود. بهتر است عنوان با کلمه کلیدی آغاز شود.',
    })
  }

  return checks
}

function runMetaDescChecks(
  metaDesc: string,
  keyword: string
): CheckResult[] {
  const checks: CheckResult[] = []
  const len = metaDesc.length

  if (!metaDesc) {
    checks.push({
      id: 'meta-empty',
      status: 'bad',
      message: 'توضیحات متا تنظیم نشده است.',
    })
    return checks
  }

  if (keyword) {
    const has = metaDesc.toLowerCase().includes(keyword.toLowerCase())
    checks.push({
      id: 'meta-keyword',
      status: has ? 'good' : 'bad',
      message: has
        ? 'کلمه کلیدی در توضیحات متا وجود دارد.'
        : 'کلمه کلیدی در توضیحات متا یافت نشد.',
    })
  }

  if (len >= 120 && len <= 160) {
    checks.push({
      id: 'meta-length',
      status: 'good',
      message: `طول توضیحات متا مناسب است (${len} کاراکتر).`,
    })
  } else if ((len >= 80 && len < 120) || (len > 160 && len <= 200)) {
    checks.push({
      id: 'meta-length',
      status: 'ok',
      message: `طول توضیحات متا قابل بهبود است (${len} کاراکتر). بهتر است بین ۱۲۰ تا ۱۶۰ کاراکتر باشد.`,
    })
  } else {
    checks.push({
      id: 'meta-length',
      status: 'bad',
      message: `طول توضیحات متا نامناسب است (${len} کاراکتر). بهتر است بین ۱۲۰ تا ۱۶۰ کاراکتر باشد.`,
    })
  }

  return checks
}

function runContentChecks(
  content: string,
  keyword: string
): CheckResult[] {
  const checks: CheckResult[] = []
  const words = wordCount(content)

  // Content length
  if (words >= 300) {
    checks.push({
      id: 'content-length',
      status: 'good',
      message: `تعداد کلمات محتوا مناسب است (${words} کلمه).`,
    })
  } else if (words >= 150) {
    checks.push({
      id: 'content-length',
      status: 'ok',
      message: `تعداد کلمات محتوا کم است (${words} کلمه). بهتر است بیش از ۳۰۰ کلمه باشد.`,
    })
  } else {
    checks.push({
      id: 'content-length',
      status: 'bad',
      message: `تعداد کلمات محتوا بسیار کم است (${words} کلمه). حداقل ۳۰۰ کلمه توصیه می‌شود.`,
    })
  }

  if (keyword) {
    // Keyword in first paragraph
    const first = getFirstParagraph(content)
    const inFirst = first.toLowerCase().includes(keyword.toLowerCase())
    checks.push({
      id: 'content-first-para',
      status: inFirst ? 'good' : 'bad',
      message: inFirst
        ? 'کلمه کلیدی در پاراگراف اول وجود دارد.'
        : 'کلمه کلیدی در پاراگراف اول یافت نشد.',
    })

    // Keyword density
    const density = keywordDensity(content, keyword)
    const densityFixed = density.toFixed(1)
    if (density >= 1 && density <= 3) {
      checks.push({
        id: 'content-density',
        status: 'good',
        message: `چگالی کلمه کلیدی مناسب است (${densityFixed}%).`,
      })
    } else if (
      (density >= 0.5 && density < 1) ||
      (density > 3 && density <= 4)
    ) {
      checks.push({
        id: 'content-density',
        status: 'ok',
        message: `چگالی کلمه کلیدی قابل بهبود است (${densityFixed}%). بهتر است بین ۱٪ تا ۳٪ باشد.`,
      })
    } else {
      checks.push({
        id: 'content-density',
        status: 'bad',
        message:
          density === 0
            ? 'کلمه کلیدی در محتوا استفاده نشده است.'
            : `چگالی کلمه کلیدی نامناسب است (${densityFixed}%). بهتر است بین ۱٪ تا ۳٪ باشد.`,
      })
    }

    // Headings with keyword
    const headingHas = hasHeadingWithKeyword(content, keyword)
    checks.push({
      id: 'content-heading-keyword',
      status: headingHas ? 'good' : 'ok',
      message: headingHas
        ? 'کلمه کلیدی در حداقل یکی از سرتیترها (H2/H3) وجود دارد.'
        : 'کلمه کلیدی در هیچ سرتیتری (H2/H3) یافت نشد.',
    })
  }

  // Images
  if (hasImages(content)) {
    const { total, withAlt } = imagesHaveAlt(content)
    if (withAlt === total) {
      checks.push({
        id: 'content-img-alt',
        status: 'good',
        message: `تمام تصاویر (${total}) دارای متن جایگزین (alt) هستند.`,
      })
    } else {
      checks.push({
        id: 'content-img-alt',
        status: withAlt > 0 ? 'ok' : 'bad',
        message: `${total - withAlt} تصویر از ${total} تصویر فاقد متن جایگزین (alt) هستند.`,
      })
    }
  } else {
    checks.push({
      id: 'content-img-alt',
      status: 'ok',
      message: 'هیچ تصویری در محتوا یافت نشد. افزودن تصویر توصیه می‌شود.',
    })
  }

  // Internal links
  const hasInternal = hasInternalLinks(content)
  checks.push({
    id: 'content-internal-links',
    status: hasInternal ? 'good' : 'ok',
    message: hasInternal
      ? 'لینک‌های داخلی در محتوا وجود دارد.'
      : 'لینک داخلی در محتوا یافت نشد. افزودن لینک داخلی توصیه می‌شود.',
  })

  // External links
  const hasExternal = hasExternalLinks(content)
  checks.push({
    id: 'content-external-links',
    status: hasExternal ? 'good' : 'ok',
    message: hasExternal
      ? 'لینک‌های خارجی در محتوا وجود دارد.'
      : 'لینک خارجی در محتوا یافت نشد. افزودن لینک خارجی معتبر توصیه می‌شود.',
  })

  return checks
}

function runUrlChecks(slug: string, keyword: string): CheckResult[] {
  const checks: CheckResult[] = []
  const len = slug.length

  if (keyword) {
    const has =
      slug
        .toLowerCase()
        .includes(keyword.toLowerCase().replace(/\s+/g, '-')) ||
      slug
        .toLowerCase()
        .includes(keyword.toLowerCase().replace(/\s+/g, ''))
    checks.push({
      id: 'url-keyword',
      status: has ? 'good' : 'bad',
      message: has
        ? 'کلمه کلیدی در آدرس URL وجود دارد.'
        : 'کلمه کلیدی در آدرس URL یافت نشد.',
    })
  }

  if (len === 0) {
    checks.push({
      id: 'url-length',
      status: 'bad',
      message: 'آدرس URL تنظیم نشده است.',
    })
  } else if (len < 75) {
    checks.push({
      id: 'url-length',
      status: 'good',
      message: `طول آدرس URL مناسب است (${len} کاراکتر).`,
    })
  } else if (len <= 100) {
    checks.push({
      id: 'url-length',
      status: 'ok',
      message: `طول آدرس URL قابل بهبود است (${len} کاراکتر). بهتر است کمتر از ۷۵ کاراکتر باشد.`,
    })
  } else {
    checks.push({
      id: 'url-length',
      status: 'bad',
      message: `طول آدرس URL زیاد است (${len} کاراکتر). بهتر است کمتر از ۷۵ کاراکتر باشد.`,
    })
  }

  return checks
}

function runReadabilityChecks(content: string): CheckResult[] {
  const checks: CheckResult[] = []
  const paragraphs = getParagraphs(content)
  const sentences = getSentences(stripHtml(content))

  // Paragraph length
  if (paragraphs.length === 0) {
    checks.push({
      id: 'read-para-length',
      status: 'bad',
      message: 'محتوایی برای تحلیل خوانایی وجود ندارد.',
    })
  } else {
    const longParas = paragraphs.filter(
      (p) => p.split(/\s+/).filter(Boolean).length > 150
    )
    if (longParas.length === 0) {
      checks.push({
        id: 'read-para-length',
        status: 'good',
        message: 'طول پاراگراف‌ها مناسب است.',
      })
    } else {
      checks.push({
        id: 'read-para-length',
        status: longParas.length > 2 ? 'bad' : 'ok',
        message: `${longParas.length} پاراگراف بیش از حد طولانی است. بهتر است هر پاراگراف حداکثر ۱۵۰ کلمه باشد.`,
      })
    }
  }

  // Sentence length
  if (sentences.length > 0) {
    const longSentences = sentences.filter(
      (s) => s.split(/\s+/).filter(Boolean).length > 25
    )
    const ratio = longSentences.length / sentences.length
    if (ratio <= 0.15) {
      checks.push({
        id: 'read-sentence-length',
        status: 'good',
        message: 'طول جملات مناسب است.',
      })
    } else if (ratio <= 0.3) {
      checks.push({
        id: 'read-sentence-length',
        status: 'ok',
        message: `${longSentences.length} جمله از ${sentences.length} جمله بیش از ۲۵ کلمه دارد. سعی کنید جملات را کوتاه‌تر کنید.`,
      })
    } else {
      checks.push({
        id: 'read-sentence-length',
        status: 'bad',
        message: `${longSentences.length} جمله از ${sentences.length} جمله بیش از حد طولانی است.`,
      })
    }
  }

  // Passive voice
  if (sentences.length > 0) {
    const passiveCount = countPassiveSentences(stripHtml(content))
    const passiveRatio = passiveCount / sentences.length
    if (passiveRatio <= 0.1) {
      checks.push({
        id: 'read-passive',
        status: 'good',
        message: 'میزان استفاده از فعل مجهول مناسب است.',
      })
    } else if (passiveRatio <= 0.2) {
      checks.push({
        id: 'read-passive',
        status: 'ok',
        message: `${passiveCount} جمله مجهول شناسایی شد. سعی کنید از فعل معلوم بیشتر استفاده کنید.`,
      })
    } else {
      checks.push({
        id: 'read-passive',
        status: 'bad',
        message: `${passiveCount} جمله مجهول شناسایی شد. استفاده بیش از حد از فعل مجهول خوانایی را کاهش می‌دهد.`,
      })
    }
  }

  // Consecutive sentences starting with same word
  if (sentences.length >= 3) {
    let consecutive = 0
    for (let i = 1; i < sentences.length; i++) {
      const prevFirst = sentences[i - 1].split(/\s+/)[0]
      const currFirst = sentences[i].split(/\s+/)[0]
      if (prevFirst && currFirst && prevFirst === currFirst) {
        consecutive++
      }
    }
    if (consecutive === 0) {
      checks.push({
        id: 'read-consecutive',
        status: 'good',
        message: 'تنوع در شروع جملات مناسب است.',
      })
    } else {
      checks.push({
        id: 'read-consecutive',
        status: consecutive > 3 ? 'bad' : 'ok',
        message: `${consecutive} جمله متوالی با کلمه یکسان شروع شده‌اند. تنوع در شروع جملات خوانایی را بهبود می‌بخشد.`,
      })
    }
  }

  return checks
}

// ---------------------------------------------------------------------------
// Score Calculation
// ---------------------------------------------------------------------------

function calcScore(checks: CheckResult[]): number {
  if (checks.length === 0) return 0
  let total = 0
  for (const c of checks) {
    if (c.status === 'good') total += 100
    else if (c.status === 'ok') total += 55
    else total += 10
  }
  return Math.round(total / checks.length)
}

function scoreColor(score: number): string {
  if (score >= 71) return '#1e8a3c'
  if (score >= 41) return '#ee7c1b'
  return '#dc3232'
}

function scoreLabel(score: number): string {
  if (score >= 71) return 'خوب'
  if (score >= 41) return 'قابل بهبود'
  return 'ضعیف'
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScoreCircle({
  score,
  label,
  size = 80,
}: {
  score: number
  label: string
  size?: number
}) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const color = scoreColor(score)
  const [animatedOffset, setAnimatedOffset] = useState(circumference)

  useEffect(() => {
    const target = circumference - (score / 100) * circumference
    const t = setTimeout(() => setAnimatedOffset(target), 60)
    return () => clearTimeout(t)
  }, [score, circumference])

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={6}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animatedOffset}
            style={{
              transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.4s',
            }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-bold text-sm"
          style={{ color }}
        >
          {score}
        </span>
      </div>
      <span className="text-xs font-bold" style={{ color }}>
        {label}
      </span>
    </div>
  )
}

function Bullet({ status }: { status: CheckStatus }) {
  if (status === 'good')
    return <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
  if (status === 'ok')
    return <MinusCircle size={16} className="shrink-0 text-orange-400" />
  return <AlertCircle size={16} className="shrink-0 text-red-500" />
}

function CheckRow({ check }: { check: CheckResult }) {
  return (
    <div className="flex items-start gap-2 py-1.5 px-1">
      <Bullet status={check.status} />
      <span className="text-sm leading-6 text-gray-700">{check.message}</span>
    </div>
  )
}

function CollapsibleSection({
  title,
  icon,
  checks,
  defaultOpen = true,
}: {
  title: string
  icon: React.ReactNode
  checks: CheckResult[]
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const good = checks.filter((c) => c.status === 'good').length
  const ok = checks.filter((c) => c.status === 'ok').length
  const bad = checks.filter((c) => c.status === 'bad').length

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-bold text-sm text-gray-800">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          {bad > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              {bad}
            </span>
          )}
          {ok > 0 && (
            <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
              {ok}
            </span>
          )}
          {good > 0 && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {good}
            </span>
          )}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: open ? `${checks.length * 48 + 24}px` : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="px-4 py-2 divide-y divide-gray-100">
          {checks.map((c) => (
            <CheckRow key={c.id} check={c} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Google SERP Preview
// ---------------------------------------------------------------------------

function GooglePreview({
  metaTitle,
  title,
  slug,
  metaDesc,
  excerpt,
}: {
  metaTitle: string
  title: string
  slug: string
  metaDesc: string
  excerpt: string
}) {
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop')
  const displayTitle = (metaTitle || title || '').slice(0, 60)
  const displayUrl = `https://example.com/${slug || ''}`
  const displayDesc = (metaDesc || excerpt || '').slice(0, 160)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-gray-200 bg-gray-50 px-4">
        <button
          type="button"
          onClick={() => setMode('desktop')}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            mode === 'desktop'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Monitor size={14} />
          دسکتاپ
        </button>
        <button
          type="button"
          onClick={() => setMode('mobile')}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            mode === 'mobile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Smartphone size={14} />
          موبایل
        </button>
      </div>
      {/* Preview area */}
      <div
        className={`p-4 bg-white ${mode === 'mobile' ? 'max-w-[400px] mx-auto' : ''}`}
        dir="ltr"
      >
        <div
          className={`font-sans ${mode === 'mobile' ? 'text-base' : 'text-xl'}`}
        >
          {/* URL line (Google style) */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-bold shrink-0">
              E
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-sm text-gray-800 truncate">
                example.com
              </span>
              <span className="text-xs text-gray-500 truncate">
                {displayUrl}
              </span>
            </div>
          </div>
          {/* Title */}
          <h3
            className={`text-[#1a0dab] hover:underline cursor-pointer leading-tight mt-1 ${
              mode === 'mobile' ? 'text-[16px]' : 'text-[20px]'
            }`}
            style={{ fontFamily: 'arial, sans-serif' }}
          >
            {displayTitle || 'عنوان صفحه'}
          </h3>
          {/* Description */}
          <p
            className={`text-[#4d5156] mt-1 leading-relaxed ${
              mode === 'mobile' ? 'text-[13px]' : 'text-[14px]'
            }`}
            style={{ fontFamily: 'arial, sans-serif' }}
          >
            {displayDesc ||
              'توضیحات متا صفحه در اینجا نمایش داده می‌شود...'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SeoAnalyzer({
  title,
  metaTitle,
  metaDesc,
  focusKeyword,
  content,
  slug,
  excerpt,
}: SeoAnalyzerProps) {
  // ---- SEO checks ----
  const titleChecks = useMemo(
    () => runTitleChecks(metaTitle, title, focusKeyword),
    [metaTitle, title, focusKeyword]
  )
  const metaChecks = useMemo(
    () => runMetaDescChecks(metaDesc, focusKeyword),
    [metaDesc, focusKeyword]
  )
  const contentChecks = useMemo(
    () => runContentChecks(content, focusKeyword),
    [content, focusKeyword]
  )
  const urlChecks = useMemo(
    () => runUrlChecks(slug, focusKeyword),
    [slug, focusKeyword]
  )

  const allSeoChecks = useMemo(
    () => [...titleChecks, ...metaChecks, ...contentChecks, ...urlChecks],
    [titleChecks, metaChecks, contentChecks, urlChecks]
  )

  const seoScore = useMemo(() => calcScore(allSeoChecks), [allSeoChecks])

  // ---- Readability checks ----
  const readabilityChecks = useMemo(
    () => runReadabilityChecks(content),
    [content]
  )
  const readabilityScore = useMemo(
    () => calcScore(readabilityChecks),
    [readabilityChecks]
  )

  // ---- Keyword usage count ----
  const keywordCount = useMemo(() => {
    if (!focusKeyword) return 0
    return countOccurrences(stripHtml(content), focusKeyword)
  }, [content, focusKeyword])

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200 bg-gradient-to-l from-gray-50 to-white">
        <Search size={20} className="text-gray-500" />
        <h2 className="font-bold text-base text-gray-800">تحلیلگر سئو</h2>
      </div>

      <div className="p-5 space-y-6">
        {/* ---- Score circles ---- */}
        <div className="flex items-center justify-center gap-10 py-2">
          <ScoreCircle
            score={seoScore}
            label={`سئو: ${scoreLabel(seoScore)}`}
            size={88}
          />
          <div className="w-px h-16 bg-gray-200" />
          <ScoreCircle
            score={readabilityScore}
            label={`خوانایی: ${scoreLabel(readabilityScore)}`}
            size={88}
          />
        </div>

        {/* ---- Focus keyword info ---- */}
        {focusKeyword && (
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 text-sm">
            <span className="font-bold text-gray-700">کلمه کلیدی:</span>
            <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md font-medium">
              {focusKeyword}
            </span>
            <span className="text-gray-500 mr-auto">
              تعداد استفاده در محتوا:{' '}
              <span className="font-bold text-gray-800">{keywordCount}</span>
            </span>
          </div>
        )}

        {/* ---- Google Preview ---- */}
        <div>
          <h3 className="flex items-center gap-1.5 font-bold text-sm text-gray-700 mb-2">
            <Globe size={16} />
            پیش‌نمایش گوگل
          </h3>
          <GooglePreview
            metaTitle={metaTitle}
            title={title}
            slug={slug}
            metaDesc={metaDesc}
            excerpt={excerpt}
          />
        </div>

        {/* ---- SEO Analysis sections ---- */}
        <div className="space-y-3">
          <CollapsibleSection
            title="عنوان"
            icon={<Type size={16} className="text-gray-500" />}
            checks={titleChecks}
          />
          <CollapsibleSection
            title="توضیحات متا"
            icon={<FileText size={16} className="text-gray-500" />}
            checks={metaChecks}
          />
          <CollapsibleSection
            title="محتوا"
            icon={<Eye size={16} className="text-gray-500" />}
            checks={contentChecks}
          />
          <CollapsibleSection
            title="آدرس URL"
            icon={<Link2 size={16} className="text-gray-500" />}
            checks={urlChecks}
          />
        </div>

        {/* ---- Readability section ---- */}
        <CollapsibleSection
          title="خوانایی"
          icon={<Eye size={16} className="text-gray-500" />}
          checks={readabilityChecks}
          defaultOpen={false}
        />
      </div>
    </div>
  )
}
