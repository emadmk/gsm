'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Menu, X } from 'lucide-react'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const navItems = [
    { label: 'اخبار', href: '/news' },
    { label: 'مقالات', href: '/articles' },
    { label: 'بررسی‌ها', href: '/reviews' },
  ]

  return (
    <header className="gsm-header w-full border-b border-gray-100">
      <div className="container xl:max-w-screen-xl px-4 lg:px-10 py-3 lg:py-6 flex items-center justify-between lg:justify-start">
        {/* Mobile menu button */}
        <button onClick={() => setMenuOpen(true)} className="lg:hidden">
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo */}
        <Link href="/" aria-label="بازگشت به صفحه اصلی">
          <img src="/images/logo.png" alt="لوگوی سایت جی‌اس‌ام" className="h-6 lg:h-8 object-contain" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6 mr-6">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className="subtitle-sm hover:text-primary-500 transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <button onClick={() => setSearchOpen(!searchOpen)} className="mr-auto pl-4 lg:pl-0">
          <Search className="w-5 h-5" />
        </button>

        {/* Search overlay */}
        {searchOpen && (
          <div className="fixed inset-0 z-50 bg-white lg:bg-transparent lg:relative lg:inset-auto">
            <div className="container xl:max-w-screen-xl p-4">
              <div className="flex items-center gap-4 lg:hidden mb-4">
                <button onClick={() => setSearchOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
                <img src="/images/logo.png" alt="GSM" className="h-6" />
              </div>
              <form action="/search" method="GET" className="relative">
                <input
                  type="text"
                  name="q"
                  autoFocus
                  className="h-12 w-full lg:w-80 bg-primary-20 rounded-lg p-3 pr-10 border border-gray-200 caption placeholder-gray-300 outline-none focus:border-primary-500"
                  placeholder="عبارت خود را جستجو کنید"
                />
                <Search className="w-5 h-5 absolute right-3 top-3.5 text-gray-700" />
              </form>
            </div>
          </div>
        )}

        {/* Mobile Menu Overlay */}
        <div className={`fixed inset-0 z-[99999] lg:hidden transition-all duration-500 ${menuOpen ? '' : 'pointer-events-none'}`}>
          <div className={`absolute inset-0 bg-black/50 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMenuOpen(false)} />
          <nav className={`absolute top-0 right-0 h-full w-72 bg-white transition-transform duration-500 ${menuOpen ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <button onClick={() => setMenuOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {navItems.map(item => (
                <Link key={item.href} href={item.href} className="block subtitle-sm py-2" onClick={() => setMenuOpen(false)}>
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
