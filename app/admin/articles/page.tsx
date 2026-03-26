'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'

interface Article {
  id: number
  title: string
  postType: string
  status: string
  publishedAt: string | null
  viewCount: number
  author: { name: string } | null
  category: { name: string } | null
}

const postTypeTabs = [
  { value: '', label: 'همه' },
  { value: 'NEWS', label: 'اخبار' },
  { value: 'ARTICLE', label: 'مقالات' },
  { value: 'REVIEW', label: 'بررسی‌ها' },
]

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

export default function ArticlesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [articles, setArticles] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  const page = parseInt(searchParams.get('page') || '1')
  const postType = searchParams.get('postType') || ''
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search') || ''

  const [searchInput, setSearchInput] = useState(search)

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', page.toString())
    params.set('limit', '20')
    if (postType) params.set('postType', postType)
    if (status) params.set('status', status)
    if (search) params.set('search', search)

    try {
      const res = await fetch(`/api/articles?${params}`)
      const data = await res.json()
      setArticles(data.articles || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 0)
    } catch {
      // error
    } finally {
      setLoading(false)
    }
  }, [page, postType, status, search])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    // Reset page when filters change
    if (!updates.page) {
      params.delete('page')
    }
    router.push(`/admin/articles?${params}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ search: searchInput })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این مطلب اطمینان دارید؟')) return
    try {
      const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchArticles()
      }
    } catch {
      // error
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('fa-IR')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">مطالب</h1>
        <Link
          href="/admin/articles/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          مطلب جدید
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        {/* Post type tabs */}
        <div className="flex flex-wrap gap-2">
          {postTypeTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => updateParams({ postType: tab.value })}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                postType === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => updateParams({ status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="DRAFT">پیش‌نویس</option>
            <option value="PUBLISHED">منتشر شده</option>
          </select>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="جستجو در عنوان..."
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
            >
              جستجو
            </button>
          </form>
        </div>

        <p className="text-sm text-gray-500">
          {total.toLocaleString('fa-IR')} مطلب یافت شد
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    ID
                  </th>
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
                    تاریخ انتشار
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
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{article.id}</td>
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
                      {formatDate(article.publishedAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {article.viewCount.toLocaleString('fa-IR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/articles/${article.id}`}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="ویرایش"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {articles.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      مطلبی یافت نشد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              صفحه {page.toLocaleString('fa-IR')} از{' '}
              {totalPages.toLocaleString('fa-IR')}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateParams({ page: (page - 1).toString() })}
                disabled={page <= 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateParams({ page: (page + 1).toString() })}
                disabled={page >= totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
