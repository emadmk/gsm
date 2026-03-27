'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Menu, X } from 'lucide-react'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [showHeader, setShowHeader] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const lastScrollY = useRef(0)
  const pathname = usePathname()

  const navItems = [
    { label: 'اخبار', href: '/news' },
    { label: 'مقالات', href: '/articles' },
    { label: 'بررسی‌ها', href: '/reviews' },
  ]

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY
      setIsScrolled(currentY > 10)

      if (currentY < 80) {
        setShowHeader(true)
      } else if (currentY > lastScrollY.current + 5) {
        setShowHeader(false)
      } else if (currentY < lastScrollY.current - 5) {
        setShowHeader(true)
      }
      lastScrollY.current = currentY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <header
      className={`
        gsm-header w-full border-b border-gray-100
        sticky top-0 z-50
        transition-all duration-300 ease-out
        ${showHeader ? 'translate-y-0' : '-translate-y-full'}
        ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-white'}
      `}
    >
      <div className="container xl:max-w-screen-xl px-4 lg:px-10 py-3 lg:py-6 flex items-center justify-between lg:justify-start">
        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(true)}
          className="lg:hidden p-1 hover:bg-gray-50 rounded-lg transition-colors"
          aria-label="باز کردن منو"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo */}
        <Link href="/" aria-label="بازگشت به صفحه اصلی" className="transition-opacity hover:opacity-80">
          <img src="/images/logo.png" alt="لوگوی سایت جی‌اس‌ام" className="h-6 lg:h-8 object-contain" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6 mr-6">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative subtitle-sm py-1 transition-colors
                after:absolute after:bottom-0 after:right-0 after:h-0.5
                after:bg-primary-500 after:transition-all after:duration-300
                ${isActive(item.href)
                  ? 'text-primary-500 after:w-full'
                  : 'text-gray-700 hover:text-primary-500 after:w-0 hover:after:w-full'
                }
              `}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Search toggle */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="mr-auto pl-4 lg:pl-0 p-1 hover:bg-gray-50 rounded-lg transition-colors"
          aria-label="جستجو"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Search overlay */}
        <div
          className={`
            fixed inset-0 z-50 bg-white lg:bg-transparent lg:relative lg:inset-auto
            transition-all duration-300
            ${searchOpen
              ? 'opacity-100 visible'
              : 'opacity-0 invisible lg:opacity-100 lg:visible'
            }
          `}
        >
          <div className="container xl:max-w-screen-xl p-4">
            <div className="flex items-center gap-4 lg:hidden mb-4">
              <button onClick={() => setSearchOpen(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
              <img src="/images/logo.png" alt="GSM" className="h-6" />
            </div>
            <form action="/search" method="GET" className="relative">
              <input
                type="text"
                name="q"
                autoFocus={searchOpen}
                className={`
                  h-12 bg-primary-20 rounded-lg p-3 pr-10
                  border border-gray-200 caption placeholder-gray-300
                  outline-none focus:border-primary-500
                  transition-all duration-300 ease-out
                  ${searchOpen ? 'w-full lg:w-80' : 'w-0 lg:w-80'}
                `}
                placeholder="عبارت خود را جستجو کنید"
              />
              <Search className="w-5 h-5 absolute right-3 top-3.5 text-gray-700" />
            </form>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`fixed inset-0 z-[99999] lg:hidden transition-all duration-500 ${menuOpen ? '' : 'pointer-events-none'}`}>
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setMenuOpen(false)}
          />
          {/* Slide-in panel from right (RTL) */}
          <nav
            className={`
              absolute top-0 right-0 h-full w-72 bg-white
              transition-transform duration-500 ease-out
              ${menuOpen ? 'translate-x-0' : 'translate-x-full'}
              overflow-y-auto shadow-2xl
            `}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <img src="/images/logo.png" alt="GSM" className="h-6" />
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-1">
              {navItems.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    block subtitle-sm py-3 px-3 rounded-lg
                    transition-all duration-300
                    ${isActive(item.href)
                      ? 'text-primary-500 bg-primary-20'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-primary-500'
                    }
                  `}
                  style={{ transitionDelay: menuOpen ? `${i * 50}ms` : '0ms' }}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
