'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession, SessionProvider, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Tags,
  Users,
  MessageSquare,
  CircleDot,
  Megaphone,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  ChevronDown,
  ChevronLeft,
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'داشبورد', icon: LayoutDashboard },
  { href: '/admin/articles', label: 'مطالب', icon: FileText },
  { href: '/admin/categories', label: 'دسته‌بندی‌ها', icon: FolderTree },
  { href: '/admin/tags', label: 'تگ‌ها', icon: Tags },
  { href: '/admin/authors', label: 'نویسندگان', icon: Users },
  { href: '/admin/comments', label: 'نظرات', icon: MessageSquare },
  { href: '/admin/stories', label: 'استوری‌ها', icon: CircleDot },
  { href: '/admin/ads', label: 'تبلیغات', icon: Megaphone },
  { href: '/admin/settings', label: 'تنظیمات', icon: Settings },
]

const breadcrumbMap: Record<string, string> = {
  '/admin': 'داشبورد',
  '/admin/articles': 'مطالب',
  '/admin/articles/new': 'مطلب جدید',
  '/admin/categories': 'دسته‌بندی‌ها',
  '/admin/tags': 'تگ‌ها',
  '/admin/authors': 'نویسندگان',
  '/admin/comments': 'نظرات',
  '/admin/stories': 'استوری‌ها',
  '/admin/ads': 'تبلیغات',
  '/admin/settings': 'تنظیمات',
}

function getBreadcrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  const crumbs: Array<{ label: string; href: string }> = []
  let path = ''
  for (const part of parts) {
    path += '/' + part
    const label = breadcrumbMap[path]
    if (label) {
      crumbs.push({ label, href: path })
    } else if (/^\d+$/.test(part)) {
      crumbs.push({ label: 'ویرایش', href: path })
    }
  }
  return crumbs
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return (
      <SessionProvider>
        {children}
      </SessionProvider>
    )
  }

  return (
    <SessionProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </SessionProvider>
  )
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center font-bold text-white text-lg animate-pulse">
            GSM
          </div>
          <div className="h-1 w-24 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-blue-600 rounded-full animate-[shimmer_1s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const breadcrumbs = getBreadcrumbs(pathname)
  const userName = session?.user?.name || session?.user?.email || 'کاربر'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 right-0 z-50 h-full w-[270px] flex flex-col
          bg-[#0f172a] text-white
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center font-extrabold text-sm shadow-lg shadow-blue-500/30">
              GSM
            </div>
            <div>
              <div className="font-bold text-base leading-tight">جی‌اس‌ام</div>
              <div className="text-[11px] text-blue-300/80 font-medium">پنل مدیریت</div>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                  transition-all duration-200 group
                  ${
                    active
                      ? 'bg-blue-600/20 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }
                `}
              >
                {/* Active indicator bar */}
                {active && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-blue-500 rounded-l-full" />
                )}
                <item.icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                  active ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400'
                }`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User section at bottom */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-200 truncate">{userName}</div>
              <div className="text-[11px] text-gray-500">مدیر سیستم</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-gray-400 hover:bg-white/5 hover:text-red-400 w-full transition-colors mt-1"
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            <span>خروج از حساب</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
          {/* Right: Menu + Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            {/* Breadcrumb */}
            <nav className="hidden sm:flex items-center gap-1.5 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.href} className="flex items-center gap-1.5">
                  {index > 0 && <ChevronLeft className="w-3.5 h-3.5 text-gray-300" />}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-gray-800 font-medium">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="text-gray-400 hover:text-gray-600 transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>

            {/* Mobile title */}
            <div className="sm:hidden flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center font-bold text-white text-[10px]">
                GSM
              </div>
              <span className="font-bold text-sm text-gray-800">
                {breadcrumbs[breadcrumbs.length - 1]?.label || 'پنل مدیریت'}
              </span>
            </div>
          </div>

          {/* Left: Notifications + User */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* User dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                  {userInitial}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {userName}
                </span>
                <ChevronDown className={`hidden md:block w-4 h-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown menu */}
              <div className={`absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 transition-all duration-200 origin-top-left ${
                userMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}>
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-800">{userName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{session?.user?.email}</div>
                </div>
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  تنظیمات
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/admin/login' })}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  خروج از حساب
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
