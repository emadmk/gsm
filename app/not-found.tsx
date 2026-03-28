import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-500 mb-4">۴۰۴</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">صفحه مورد نظر یافت نشد</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto body-lg">
          متأسفانه صفحه‌ای که دنبال آن هستید وجود ندارد یا منتقل شده است.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-600 transition-colors"
          >
            <Home className="w-5 h-5" />
            بازگشت به صفحه اصلی
          </Link>

          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <Search className="w-5 h-5" />
            جستجو
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm mb-4">شاید این صفحات برایتان مفید باشد:</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/news" className="text-primary-500 hover:underline">اخبار</Link>
            <Link href="/articles" className="text-primary-500 hover:underline">مقالات</Link>
            <Link href="/reviews" className="text-primary-500 hover:underline">بررسی‌ها</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
