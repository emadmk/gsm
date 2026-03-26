'use client'

import { useEffect, useState } from 'react'
import { List } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content?: string
  className?: string
}

function extractHeadings(html: string): TocItem[] {
  const parser = typeof window !== 'undefined' ? new DOMParser() : null
  if (!parser) return []

  const doc = parser.parseFromString(html, 'text/html')
  const headings = doc.querySelectorAll('h2, h3, h4')
  const items: TocItem[] = []

  headings.forEach((heading, index) => {
    const id = heading.id || `heading-${index}`
    const text = heading.textContent?.trim() || ''
    const level = parseInt(heading.tagName.charAt(1))
    if (text) {
      items.push({ id, text, level })
    }
  })

  return items
}

export default function TableOfContents({ content, className }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    if (content) {
      setHeadings(extractHeadings(content))
    }
  }, [content])

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80
      const top = element.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-post-box p-4',
        className
      )}
      dir="rtl"
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full gap-2 mb-3"
      >
        <div className="flex items-center gap-2">
          <List className="w-5 h-5 text-primary-500" />
          <h4 className="subtitle-lg text-gray-900">فهرست مطالب</h4>
        </div>
        <svg
          className={cn(
            'w-4 h-4 text-gray-400 transition-transform',
            isOpen ? 'rotate-180' : ''
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Items */}
      {isOpen && (
        <nav className="space-y-1">
          {headings.map((heading) => (
            <button
              key={heading.id}
              onClick={() => handleClick(heading.id)}
              className={cn(
                'block w-full text-right body-sm py-1.5 px-3 rounded-md transition-colors',
                heading.level === 3 && 'pr-6',
                heading.level === 4 && 'pr-9',
                activeId === heading.id
                  ? 'bg-primary-500/[0.08] text-primary-500 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
