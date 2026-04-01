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
  Database,
  MessageSquare,
  CircleDot,
  Megaphone,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Zap,
  Mail,
  Image as ImageIcon,
  ChevronDown,
  Bell,
  Globe,
  Brain,
} from 'lucide-react'
import { hasRequiredRole, type AdminRole } from '@/lib/admin-security'

const navItems = [
  { href: '/admin', label: 'داشبورد', icon: LayoutDashboard },
  { href: '/admin/articles', label: 'مطالب', icon: FileText },
  { href: '/admin/categories', label: 'دسته‌بندی‌ها', icon: FolderTree },
  { href: '/admin/tags', label: 'تگ‌ها', icon: Tags },
  { href: '/admin/authors', label: 'نویسندگان', icon: Users },
  { href: '/admin/brands', label: 'برندها', icon: Zap },
  { href: '/admin/comments', label: 'نظرات', icon: MessageSquare },
  { href: '/admin/stories', label: 'استوری‌ها', icon: CircleDot },
  { href: '/admin/ads', label: 'تبلیغات', icon: Megaphone },
  { href: '/admin/media', label: 'کتابخانه رسانه', icon: ImageIcon, requiredRole: 'ADMIN' as AdminRole },
  { href: '/admin/seo', label: 'مدیریت SEO', icon: Globe, requiredRole: 'ADMIN' as AdminRole },
  { href: '/admin/aeo', label: 'بهینه‌سازی AEO', icon: Brain, requiredRole: 'ADMIN' as AdminRole },
  { href: '/admin/contact', label: 'پیام‌ها', icon: Mail },
  { href: '/admin/import/strapi', label: 'درون‌ریزی', icon: Database, requiredRole: 'ADMIN' as AdminRole },
  { href: '/admin/settings', label: 'تنظیمات', icon: Settings, requiredRole: 'ADMIN' as AdminRole },
]

const breadcrumbMap: Record<string, string> = {
  '/admin': 'داشبورد',
  '/admin/articles': 'مطالب',
  '/admin/articles/new': 'مطلب جدید',
  '/admin/categories': 'دسته‌بندی‌ها',
  '/admin/tags': 'تگ‌ها',
  '/admin/authors': 'نویسندگان',
  '/admin/brands': 'برندها',
  '/admin/comments': 'نظرات',
  '/admin/stories': 'استوری‌ها',
  '/admin/ads': 'تبلیغات',
  '/admin/media': 'کتابخانه رسانه',
  '/admin/media/settings': 'تنظیمات رسانه',
  '/admin/seo': 'مدیریت SEO',
  '/admin/aeo': 'بهینه‌سازی AEO',
  '/admin/contact': 'پیام‌ها',
  '/admin/import/strapi': 'درون‌ریزی Strapi',
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50" dir="rtl">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center shadow-2xl shadow-blue-600/30">
              <span className="text-white font-black text-xl tracking-tight">GSM</span>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 animate-ping opacity-20" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-sm text-gray-400 font-medium">در حال بارگذاری پنل مدیریت...</p>
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
  const userRole = session?.user?.role
  const visibleNavItems = navItems.filter(
    (item) => !item.requiredRole || hasRequiredRole(userRole, item.requiredRole)
  )

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar - 260px, dark gradient, sticky full height */}
      <aside
        className={`
          fixed top-0 right-0 z-50 h-full w-[260px] flex flex-col
          bg-gradient-to-b from-slate-900 to-slate-800 text-white
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:sticky lg:top-0 lg:z-auto lg:h-screen
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          shadow-2xl lg:shadow-none
        `}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-5 pt-6 pb-5 border-b border-white/[0.08]">
          <Link href="/admin" className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-blue-500/25 ring-1 ring-white/10">
              GSM
            </div>
            <div>
              <div className="font-extrabold text-lg leading-tight bg-gradient-to-l from-blue-400 to-blue-200 bg-clip-text text-transparent">
                GSM
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">پنل مدیریت</div>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="px-3 mb-3">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">منوی اصلی</span>
          </div>
          {visibleNavItems.map((item) => {
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
                      ? 'bg-white/10 text-white'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                {/* Active indicator bar on right edge */}
                {active && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-500 rounded-l-full shadow-lg shadow-blue-500/50" />
                )}
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                  active ? 'bg-blue-500/20' : 'bg-transparent group-hover:bg-white/5'
                }`}>
                  <item.icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                    active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`} />
                </div>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User section at bottom */}
        <div className="p-3 border-t border-white/[0.08]">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.04]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 ring-2 ring-white/10 shadow-lg">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-200 truncate">{userName}</div>
              <div className="text-[11px] text-slate-500">مدیر سیستم</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-slate-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-all duration-200 mt-1.5"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            </div>
            <span>خروج از حساب</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white shadow-sm px-4 lg:px-6 py-4 flex items-center justify-between gap-4 border-b border-gray-100">
          {/* Right side: Menu button + Breadcrumb */}
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
                    <span className="text-gray-800 font-semibold">{crumb.label}</span>
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
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-[10px]">
                GSM
              </div>
              <span className="font-bold text-sm text-gray-800">
                {breadcrumbs[breadcrumbs.length - 1]?.label || 'پنل مدیریت'}
              </span>
            </div>
          </div>

          {/* Left side: Notifications + User dropdown */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            <div className="w-px h-8 bg-gray-200 mx-1 hidden md:block" />

            {/* User dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 py-1.5 px-2.5 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-blue-500/20">
                  {userInitial}
                </div>
                <div className="hidden md:block text-right">
                  <div className="text-sm font-semibold text-gray-700 max-w-[120px] truncate">{userName}</div>
                  <div className="text-[11px] text-gray-400">مدیر سیستم</div>
                </div>
                <ChevronDown className={`hidden md:block w-4 h-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              <div className={`absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 transition-all duration-200 origin-top-left ${
                userMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}>
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-semibold text-gray-800">{userName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{session?.user?.email}</div>
                </div>
                <div className="py-1">
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    تنظیمات
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/admin/login' })}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    خروج از حساب
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
