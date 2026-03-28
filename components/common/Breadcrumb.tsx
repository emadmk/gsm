import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumb({ items, className }: BreadcrumbProps) {
  const allItems: BreadcrumbItem[] = [{ label: '\u062e\u0627\u0646\u0647', href: '/' }, ...items]

  return (
    <nav
      className={cn('flex items-center gap-1.5 py-4 overflow-x-auto scrollbar-hide', className)}
      dir="rtl"
      aria-label="breadcrumb"
    >
      {allItems.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5 flex-shrink-0">
          {index > 0 && (
            <span className="text-gray-300 body-sm">/</span>
          )}
          {item.href && index < allItems.length - 1 ? (
            <Link
              href={item.href}
              className="caption text-gray-400 hover:text-primary-500 transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ) : (
            <span className="caption text-gray-600 whitespace-nowrap">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}
