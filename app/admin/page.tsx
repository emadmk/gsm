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
  Users,
  Settings,
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
      <div className="flex items-center justify-center h-80">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-blue-200 animate-pulse" />
          </div>
          <p className="text-sm text-gray-400 font-medium">در حال بارگذاری آمار...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <span className="text-2xl">!</span>
        </div>
        <p className="text-red-500 font-medium">خطا در بارگذاری آمار</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          تلاش مجدد
        </button>
      </div>
    )
  }

  const statCards = [
    {
      label: 'کل اخبار',
      value: toPersianNum(stats.articles.news),
      icon: Newspaper,
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-500',
      iconColor: 'text-white',
      borderColor: 'border-b-blue-500',
    },
    {
      label: 'مقالات',
      value: toPersianNum(stats.articles.articles),
      icon: FileText,
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-500',
      iconColor: 'text-white',
      borderColor: 'border-b-emerald-500',
    },
    {
      label: 'بررسی‌ها',
      value: toPersianNum(stats.articles.reviews),
      icon: Star,
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-500',
      iconColor: 'text-white',
      borderColor: 'border-b-purple-500',
    },
    {
      label: 'نظرات در انتظار',
      value: toPersianNum(stats.comments.pending),
      icon: MessageSquare,
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-500',
      iconColor: 'text-white',
      borderColor: 'border-b-amber-500',
    },
    {
      label: 'کل بازدیدها',
      value: toPersianNum(stats.totalViews),
      icon: Eye,
      bg: 'bg-cyan-50',
      iconBg: 'bg-cyan-500',
      iconColor: 'text-white',
      borderColor: 'border-b-cyan-500',
    },
    {
      label: 'کل نظرات',
      value: toPersianNum(stats.comments.total),
      icon: Users,
      bg: 'bg-rose-50',
      iconBg: 'bg-rose-500',
      iconColor: 'text-white',
      borderColor: 'border-b-rose-500',
    },
  ]

  // Distribution data
  const total = stats.articles.news + stats.articles.articles + stats.articles.reviews + stats.articles.stories
  const distItems = [
    { label: 'اخبار', count: stats.articles.news, color: 'bg-blue-500', textColor: 'text-blue-600', percent: total > 0 ? Math.round((stats.articles.news / total) * 100) : 0 },
    { label: 'مقالات', count: stats.articles.articles, color: 'bg-emerald-500', textColor: 'text-emerald-600', percent: total > 0 ? Math.round((stats.articles.articles / total) * 100) : 0 },
    { label: 'بررسی‌ها', count: stats.articles.reviews, color: 'bg-purple-500', textColor: 'text-purple-600', percent: total > 0 ? Math.round((stats.articles.reviews / total) * 100) : 0 },
    { label: 'استوری‌ها', count: stats.articles.stories, color: 'bg-pink-500', textColor: 'text-pink-600', percent: total > 0 ? Math.round((stats.articles.stories / total) * 100) : 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Card with gradient */}
      <div className="relative bg-gradient-to-l from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 lg:p-8 text-white overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute left-0 top-0 w-72 h-72 bg-white/[0.06] rounded-full -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute left-24 bottom-0 w-48 h-48 bg-white/[0.04] rounded-full translate-y-1/2" />
        <div className="absolute right-10 top-10 w-20 h-20 bg-white/[0.04] rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-blue-200 text-sm mb-3">
            <Clock className="w-4 h-4" />
            <span>{getPersianDate()}</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold mb-2">
            خوش آمدید به پنل مدیریت!
          </h1>
          <p className="text-blue-100/80 text-sm lg:text-base max-w-xl leading-relaxed">
            از اینجا می‌توانید تمام محتوای سایت جی‌اس‌ام را مدیریت، ویرایش و منتشر کنید.
          </p>
        </div>
      </div>

      {/* 6 Stat Cards - 2x3 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-b-4 ${card.borderColor}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${card.iconBg} rounded-full flex items-center justify-center shadow-lg flex-shrink-0`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-0.5">{card.label}</p>
                <p className="text-2xl font-extrabold text-gray-800">{card.value}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-gray-200 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Content Distribution + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Post Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <CircleDot className="w-4.5 h-4.5 text-blue-500" />
            </div>
            توزیع مطالب
          </h2>
          <div className="space-y-5">
            {distItems.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-gray-600 font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${item.textColor}`}>{toPersianNum(item.percent)}%</span>
                    <span className="text-gray-800 font-bold text-sm">{toPersianNum(item.count)}</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${Math.max(item.percent, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">مجموع کل</span>
            <span className="font-extrabold text-gray-800 text-lg">{toPersianNum(stats.articles.total)}<span className="text-sm font-medium text-gray-400 mr-1">مطلب</span></span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm lg:col-span-2">
          <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <ArrowUpLeft className="w-4.5 h-4.5 text-indigo-500" />
            </div>
            دسترسی سریع
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              href="/admin/articles/new"
              className="flex flex-col items-center gap-3 p-5 rounded-xl bg-gradient-to-b from-blue-50 to-blue-50/30 border-2 border-blue-100 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100/50 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/25">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-blue-700">مطلب جدید</span>
            </Link>
            <Link
              href="/admin/comments"
              className="flex flex-col items-center gap-3 p-5 rounded-xl bg-gradient-to-b from-amber-50 to-amber-50/30 border-2 border-amber-100 hover:border-amber-300 hover:shadow-md hover:shadow-amber-100/50 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/25 relative">
                <MessageSquare className="w-5 h-5 text-white" />
                {stats.comments.pending > 0 && (
                  <span className="absolute -top-2 -left-2 min-w-[20px] h-[20px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white shadow">
                    {toPersianNum(stats.comments.pending)}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-amber-700">مدیریت نظرات</span>
            </Link>
            <Link
              href="/admin/settings"
              className="flex flex-col items-center gap-3 p-5 rounded-xl bg-gradient-to-b from-slate-50 to-slate-50/30 border-2 border-slate-100 hover:border-slate-300 hover:shadow-md hover:shadow-slate-100/50 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-slate-500/25">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">تنظیمات</span>
            </Link>
            <Link
              href="/admin/categories"
              className="flex flex-col items-center gap-3 p-5 rounded-xl bg-gradient-to-b from-purple-50 to-purple-50/30 border-2 border-purple-100 hover:border-purple-300 hover:shadow-md hover:shadow-purple-100/50 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/25">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-purple-700">مدیریت دسته‌بندی‌ها</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Articles Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-blue-500" />
            </div>
            آخرین مطالب
          </h2>
          <Link
            href="/admin/articles"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-lg"
          >
            مشاهده همه
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs">
                  عنوان
                </th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs">
                  نوع
                </th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs">
                  نویسنده
                </th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs">
                  تاریخ
                </th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs">
                  بازدید
                </th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs">
                  وضعیت
                </th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentArticles.map((article) => (
                <tr key={article.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                        <FileText className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <span className="line-clamp-1 max-w-xs block font-medium text-gray-800">
                        {article.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      article.postType === 'NEWS' ? 'bg-blue-100 text-blue-700' :
                      article.postType === 'ARTICLE' ? 'bg-emerald-100 text-emerald-700' :
                      article.postType === 'REVIEW' ? 'bg-purple-100 text-purple-700' :
                      'bg-pink-100 text-pink-700'
                    }`}>
                      {postTypeLabels[article.postType] || article.postType}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {article.author?.name || '-'}
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString('fa-IR')
                      : '-'}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-gray-700">{toPersianNum(article.viewCount)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        article.status === 'PUBLISHED'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        article.status === 'PUBLISHED' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      {statusLabels[article.status] || article.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-semibold bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-lg transition-colors"
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
