import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

export function formatDateShort(date: Date | string): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('fa-IR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('fa-IR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function timeAgo(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return 'همین الان'
  if (diffMin < 60) return `${diffMin} دقیقه پیش`
  if (diffHours < 24) return `${diffHours} ساعت پیش`
  if (diffDays < 7) return `${diffDays} روز پیش`
  return formatDateShort(date)
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

function getConfiguredS3BaseUrl(): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || process.env.S3_BASE_URL || ''

  return baseUrl ? baseUrl.replace(/\/$/, '') : null
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '/images/placeholder.svg'
  if (path.startsWith('http')) return path
  const baseUrl = getConfiguredS3BaseUrl()
  // Strapi stores paths like /uploads/xxx.jpg - prepend S3 base
  if (!baseUrl) return path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export function generateMetaTitle(title: string): string {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'GSM'
  return `${title} | ${siteName}`
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

export function calculateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200))
}

export function getPostTypeLabel(postType: string): string {
  const labels: Record<string, string> = {
    NEWS: 'اخبار',
    ARTICLE: 'مقاله',
    REVIEW: 'بررسی',
    STORY: 'استوری',
  }
  return labels[postType] || postType
}

export function getPostTypeSlug(postType: string): string {
  const slugs: Record<string, string> = {
    NEWS: 'news',
    ARTICLE: 'article',
    REVIEW: 'review',
    STORY: 'story',
  }
  return slugs[postType] || 'news'
}

export function getPostUrl(id: number, slug: string, postType: string): string {
  const typeSlug = getPostTypeSlug(postType)
  return `/mag/${typeSlug}/${id}/${encodeURIComponent(slug)}`
}

export function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return num.toString().replace(/[0-9]/g, (d) => persianDigits[parseInt(d)])
}

export function cleanHtmlContent(html: string | null | undefined): string {
  if (!html) return ''
  let clean = html
  // Remove Strapi's structured data attributes
  clean = clean.replace(/data-[a-z-]+="[^"]*"/gi, '')
  // Remove class attributes with thread/internal classes
  clean = clean.replace(/class="[^"]*thread[^"]*"/gi, '')
  clean = clean.replace(/class="[^"]*ck-[^"]*"/gi, '')
  // Fix S3 image URLs
  const s3BaseUrl = getConfiguredS3BaseUrl()
  if (s3BaseUrl) {
    clean = clean.replace(/src="\/uploads\//g, `src="${s3BaseUrl}/uploads/`)
  }
  // Remove empty style tags
  clean = clean.replace(/style=""/g, '')
  // Remove zero-width spaces and null bytes
  clean = clean.replace(/[\u200B-\u200D\uFEFF\x00]/g, '')
  return clean
}
