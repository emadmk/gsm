import Link from 'next/link'
import { cn, toPersianDigits } from '@/lib/utils'
import { ChevronRight, ChevronLeft } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
}

function getPageUrl(baseUrl: string, page: number): string {
  if (page === 1) return baseUrl
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}page=${page}`
}

function getPageRange(current: number, total: number): (number | 'dots')[] {
  const pages: (number | 'dots')[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  pages.push(1)

  if (current > 3) {
    pages.push('dots')
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push('dots')
  }

  pages.push(total)

  return pages
}

export default function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageRange(currentPage, totalPages)

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" dir="rtl" aria-label="pagination">
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={getPageUrl(baseUrl, currentPage - 1)}
          className="inline-flex items-center justify-center size-10 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="صفحه قبل"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      ) : (
        <span className="inline-flex items-center justify-center size-10 rounded-lg text-gray-300 cursor-not-allowed">
          <ChevronRight className="w-5 h-5" />
        </span>
      )}

      {/* Page Numbers */}
      {pages.map((page, index) =>
        page === 'dots' ? (
          <span
            key={`dots-${index}`}
            className="inline-flex items-center justify-center size-10 text-gray-400 body-sm"
          >
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={getPageUrl(baseUrl, page)}
            className={cn(
              'inline-flex items-center justify-center size-10 rounded-lg body-sm font-bold transition-colors',
              page === currentPage
                ? 'bg-primary-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            )}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {toPersianDigits(page)}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={getPageUrl(baseUrl, currentPage + 1)}
          className="inline-flex items-center justify-center size-10 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="صفحه بعد"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
      ) : (
        <span className="inline-flex items-center justify-center size-10 rounded-lg text-gray-300 cursor-not-allowed">
          <ChevronLeft className="w-5 h-5" />
        </span>
      )}
    </nav>
  )
}
