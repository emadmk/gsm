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
      value: stats.articles.news,
      icon: Newspaper,
      color: 'bg-blue-500',
    },
    {
      label: 'مقالات',
      value: stats.articles.articles,
      icon: FileText,
      color: 'bg-green-500',
    },
    {
      label: 'بررسی‌ها',
      value: stats.articles.reviews,
      icon: Star,
      color: 'bg-purple-500',
    },
    {
      label: 'نظرات در انتظار',
      value: stats.comments.pending,
      icon: MessageSquare,
      color: 'bg-orange-500',
    },
    {
      label: 'کل بازدیدها',
      value: stats.totalViews.toLocaleString('fa-IR'),
      icon: Eye,
      color: 'bg-teal-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">داشبورد</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {card.value}
                </p>
              </div>
              <div
                className={`${card.color} p-3 rounded-lg text-white`}
              >
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          دسترسی سریع
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/articles/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            مطلب جدید
          </Link>
          <Link
            href="/admin/comments"
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            نظرات در انتظار ({stats.comments.pending})
          </Link>
          <Link
            href="/admin/categories"
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
          >
            مدیریت دسته‌بندی‌ها
          </Link>
          <Link
            href="/admin/stories"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
          >
            مدیریت استوری‌ها
          </Link>
        </div>
      </div>

      {/* Recent Articles */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">
            آخرین مطالب
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  عنوان
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  نوع
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  نویسنده
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  وضعیت
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  بازدید
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recentArticles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="line-clamp-1 max-w-xs block">
                      {article.title}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                      {postTypeLabels[article.postType] || article.postType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {article.author?.name || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        article.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {statusLabels[article.status] || article.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {article.viewCount.toLocaleString('fa-IR')}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="text-blue-600 hover:text-blue-800 text-xs"
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
