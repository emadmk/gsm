'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Menu, X, Clock, ChevronLeft } from 'lucide-react'
import { stripHtml, getPostUrl } from '@/lib/utils'

interface SearchResult {
  id: number
  title: string
  slug: string
  postType: string
  excerpt: string | null
  image: string | null
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showHeader, setShowHeader] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const lastScrollY = useRef(0)
  const searchTimeout = useRef<NodeJS.Timeout>()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { label: 'اخبار', href: '/news' },
    { label: 'مقالات', href: '/articles' },
    { label: 'بررسی‌ها', href: '/reviews' },
  ]

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY
      setIsScrolled(currentY > 10)
      if (currentY < 80) setShowHeader(true)
      else if (currentY > lastScrollY.current + 5) setShowHeader(false)
      else if (currentY < lastScrollY.current - 5) setShowHeader(true)
      lastScrollY.current = currentY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Close search on route change
  useEffect(() => {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }, [pathname])

  // Auto-search with debounce
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=5`)
      const data = await res.json()
      setSearchResults(data.articles || [])
    } catch {
      setSearchResults([])
    }
    setSearching(false)
  }, [])

  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => doSearch(value), 300)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
    }
  }

  const openSearch = () => {
    setSearchOpen(true)
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const postTypeLabels: Record<string, string> = {
    NEWS: 'خبر', ARTICLE: 'مقاله', REVIEW: 'بررسی', STORY: 'استوری'
  }

  return (
    <>
      <header
        className={`
          w-full border-b border-gray-100 sticky top-0 z-50
          transition-all duration-300 ease-out
          ${showHeader ? 'translate-y-0' : '-translate-y-full'}
          ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'}
        `}
      >
        <div className="container xl:max-w-screen-xl px-4 lg:px-10 py-3 lg:py-5 flex items-center gap-4">
          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(true)} className="lg:hidden p-2 hover:bg-gray-50 rounded-xl transition-colors" aria-label="منو">
            <Menu className="w-5 h-5 text-gray-700" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl lg:text-3xl font-black bg-gradient-to-l from-blue-600 to-blue-500 bg-clip-text text-transparent">GSM</span>
            <span className="text-gray-400 text-xs font-normal hidden lg:inline border-r border-gray-200 pr-2">جی‌اس‌ام</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 mr-4">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-4 py-2 rounded-lg subtitle-sm transition-all duration-200
                  ${isActive(item.href)
                    ? 'text-primary-500 bg-primary-500/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Search Button */}
          <button
            onClick={openSearch}
            className="mr-auto flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-400 transition-all duration-200 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span className="caption hidden sm:inline">جستجو...</span>
          </button>

        </div>
      </header>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[99999]" onClick={() => setSearchOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Search Panel */}
          <div className="relative w-full max-w-2xl mx-auto mt-20 px-4" onClick={e => e.stopPropagation()}>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-down">
              {/* Search Input */}
              <form onSubmit={handleSearchSubmit} className="flex items-center border-b border-gray-100">
                <Search className="w-5 h-5 text-gray-400 mr-4" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearchInput(e.target.value)}
                  className="flex-1 h-14 bg-transparent text-gray-800 body-lg outline-none placeholder-gray-300"
                  placeholder="عبارت مورد نظر خود را جستجو کنید..."
                  autoFocus
                />
                {searchQuery && (
                  <button type="button" onClick={() => { setSearchQuery(''); setSearchResults([]) }} className="p-2 ml-2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* Results */}
              {searching && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span className="mr-3 text-gray-400 body-sm">در حال جستجو...</span>
                </div>
              )}

              {!searching && searchResults.length > 0 && (
                <div className="max-h-[400px] overflow-y-auto">
                  {searchResults.map(result => (
                    <Link
                      key={result.id}
                      href={getPostUrl(result.id, result.slug, result.postType)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      onClick={() => setSearchOpen(false)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="subtitle-sm text-gray-800 line-clamp-1">{result.title}</div>
                        {result.excerpt && (
                          <div className="caption text-gray-400 line-clamp-1 mt-0.5">{stripHtml(result.excerpt)}</div>
                        )}
                      </div>
                      <span className="caption text-primary-500 bg-primary-500/5 px-2 py-0.5 rounded shrink-0">
                        {postTypeLabels[result.postType] || result.postType}
                      </span>
                      <ChevronLeft className="w-4 h-4 text-gray-300 shrink-0" />
                    </Link>
                  ))}
                  {/* View all results */}
                  <button
                    onClick={() => { router.push(`/search?q=${encodeURIComponent(searchQuery)}`); setSearchOpen(false) }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-primary-500 hover:bg-primary-500/5 transition-colors subtitle-sm"
                  >
                    مشاهده همه نتایج
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}

              {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="flex flex-col items-center py-8 text-gray-400">
                  <Search className="w-8 h-8 mb-2 opacity-30" />
                  <span className="body-sm">نتیجه‌ای یافت نشد</span>
                </div>
              )}

              {/* Quick Links when empty */}
              {!searchQuery && (
                <div className="p-4">
                  <div className="caption text-gray-400 mb-3">دسترسی سریع</div>
                  <div className="flex flex-wrap gap-2">
                    {['سامسونگ', 'اپل', 'شیائومی', 'گوشی', 'بررسی'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleSearchInput(tag)}
                        className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg caption text-gray-600 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ESC hint */}
            <div className="flex justify-center mt-3">
              <span className="caption text-white/60 bg-black/20 px-3 py-1 rounded-lg backdrop-blur-sm">
                ESC برای بستن
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-[99999] lg:hidden transition-all duration-500 ${menuOpen ? '' : 'pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMenuOpen(false)} />
        <nav className={`absolute top-0 right-0 h-full w-72 bg-white transition-transform duration-500 ease-out ${menuOpen ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto shadow-2xl`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <span className="text-xl font-black bg-gradient-to-l from-blue-600 to-blue-500 bg-clip-text text-transparent">GSM</span>
            <button onClick={() => setMenuOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-3 space-y-1">
            {navItems.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block subtitle-sm py-3 px-4 rounded-xl transition-all ${isActive(item.href) ? 'text-primary-500 bg-primary-500/5' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  )
}
