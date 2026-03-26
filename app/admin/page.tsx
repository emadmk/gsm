'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Newspaper,
  FileText,
  Star,
  MessageSquare,
  Eye,
  Plus,
  Loader2,
  TrendingUp,
  Clock,
  ArrowUpLeft,
  CircleDot,
  FolderOpen,
} from 'lucide-react'

interface Stats {
  articles: {
    news: number
    articles: number
    reviews: number
    stories: number
    total: number
  }
  comments: {
    approved: number
    pending: number
    total: number
  }
  totalViews: number
  recentArticles: Array<{
    id: number
    title: string
    postType: string
    status: string
    publishedAt: string | null
    viewCount: number
    author: { name: string } | null
    category: { name: string } | null
  }>
}

const postTypeLabels: Record<string, string> = {
  NEWS: 'خبر',
  ARTICLE: 'مقاله',
  REVIEW: 'بررسی',
  STORY: 'استوری',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'پیش‌نویس',
  PUBLISHED: 'منتشر شده',
}

function toPersianNum(n: number | string): string {
  return n.toLocaleString('fa-IR')
}

function getPersianDate(): string {
  return new Date().toLocaleDateString('fa-IR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center text-red-500 py-10">
        خطا در بارگذاری آمار
      </div>
    )
  }

  const statCards = [
    {
      label: 'کل اخبار',
      value: toPersianNum(stats.articles.news),
      icon: Newspaper,
      gradient: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/25',
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'مقالات',
      value: toPersianNum(stats.articles.articles),
      icon: FileText,
      gradient: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-500/25',
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'بررسی‌ها',
      value: toPersianNum(stats.articles.reviews),
      icon: Star,
      gradient: 'from-purple-500 to-purple-600',
      shadow: 'shadow-purple-500/25',
      bg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: 'نظرات در انتظار',
      value: toPersianNum(stats.comments.pending),
      icon: MessageSquare,
      gradient: 'from-amber-500 to-orange-500',
      shadow: 'shadow-amber-500/25',
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      label: 'کل بازدیدها',
      value: toPersianNum(stats.totalViews),
      icon: Eye,
      gradient: 'from-cyan-500 to-teal-500',
      shadow: 'shadow-cyan-500/25',
      bg: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
    },
  ]

  // Distribution data for the bar chart
  const maxCount = Math.max(stats.articles.news, stats.articles.articles, stats.articles.reviews, stats.articles.stories, 1)
  const distItems = [
    { label: 'اخبار', count: stats.articles.news, color: 'bg-blue-500' },
    { label: 'مقالات', count: stats.articles.articles, color: 'bg-emerald-500' },
    { label: 'بررسی‌ها', count: stats.articles.reviews, color: 'bg-purple-500' },
    { label: 'استوری‌ها', count: stats.articles.stories, color: 'bg-pink-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-l from-blue-600 to-indigo-700 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute left-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute left-20 bottom-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 text-blue-200 text-sm mb-2">
            <Clock className="w-4 h-4" />
            <span>{getPersianDate()}</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">خوش آمدید!</h1>
          <p className="text-blue-100 text-sm lg:text-base">
            از اینجا می‌توانید محتوای سایت جی‌اس‌ام را مدیریت کنید.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.bg} p-2.5 rounded-xl`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Post Distribution Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
            <CircleDot className="w-5 h-5 text-blue-500" />
            توزیع مطالب
          </h2>
          <div className="space-y-4">
            {distItems.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-600 font-medium">{item.label}</span>
                  <span className="text-gray-800 font-bold">{toPersianNum(item.count)}</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${Math.max((item.count / maxCount) * 100, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">مجموع</span>
            <span className="font-bold text-gray-800">{toPersianNum(stats.articles.total)} مطلب</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:col-span-2">
          <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
            <ArrowUpLeft className="w-5 h-5 text-blue-500" />
            دسترسی سریع
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/admin/articles/new"
              className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-blue-700">مطلب جدید</span>
            </Link>
            <Link
              href="/admin/comments"
              className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 transition-all duration-200 group"
            >
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform relative">
                <MessageSquare className="w-5 h-5 text-white" />
                {stats.comments.pending > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {toPersianNum(stats.comments.pending)}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-amber-700">نظرات</span>
            </Link>
            <Link
              href="/admin/categories"
              className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
            >
              <div className="w-10 h-10 bg-gray-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">دسته‌بندی‌ها</span>
            </Link>
            <Link
              href="/admin/stories"
              className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 group"
            >
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CircleDot className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-purple-700">استوری‌ها</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Articles */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            آخرین مطالب
          </h2>
          <Link
            href="/admin/articles"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            مشاهده همه
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  عنوان
                </th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  نوع
                </th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  نویسنده
                </th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  دسته‌بندی
                </th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  وضعیت
                </th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  بازدید
                </th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentArticles.map((article) => (
                <tr key={article.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="line-clamp-1 max-w-xs block font-medium text-gray-800">
                      {article.title}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
                      article.postType === 'NEWS' ? 'bg-blue-100 text-blue-700' :
                      article.postType === 'ARTICLE' ? 'bg-emerald-100 text-emerald-700' :
                      article.postType === 'REVIEW' ? 'bg-purple-100 text-purple-700' :
                      'bg-pink-100 text-pink-700'
                    }`}>
                      {postTypeLabels[article.postType] || article.postType}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {article.author?.name || '-'}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {article.category?.name || '-'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        article.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        article.status === 'PUBLISHED' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      {statusLabels[article.status] || article.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 font-medium">
                    {toPersianNum(article.viewCount)}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      ویرایش
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
