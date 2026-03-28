'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  MoreHorizontal,
  ImageIcon,
} from 'lucide-react'

interface Article {
  id: number
  title: string
  slug: string
  image: string | null
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

const postTypeColors: Record<string, string> = {
  NEWS: 'bg-blue-100 text-blue-700',
  ARTICLE: 'bg-emerald-100 text-emerald-700',
  REVIEW: 'bg-purple-100 text-purple-700',
  STORY: 'bg-pink-100 text-pink-700',
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const page = parseInt(searchParams.get('page') || '1')
  const postType = searchParams.get('postType') || ''
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search') || ''

  const [searchInput, setSearchInput] = useState(search)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

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

  // Clear selection when data changes
  useEffect(() => {
    setSelectedIds(new Set())
  }, [articles])

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    if (!updates.page) {
      params.delete('page')
    }
    router.push(`/admin/articles?${params}`)
  }

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParams({ search: value })
    }, 400)
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

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`آیا از حذف ${selectedIds.size.toLocaleString('fa-IR')} مطلب اطمینان دارید؟`)) return
    setBulkDeleting(true)
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/articles/${id}`, { method: 'DELETE' })
        )
      )
      fetchArticles()
    } catch {
      // error
    } finally {
      setBulkDeleting(false)
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === articles.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(articles.map((a) => a.id)))
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('fa-IR')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">مدیریت مطالب</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total.toLocaleString('fa-IR')} مطلب یافت شد
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/25"
        >
          <Plus className="w-4 h-4" />
          مطلب جدید
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        {/* Post type tabs */}
        <div className="flex flex-wrap gap-1 bg-gray-50 rounded-xl p-1">
          {postTypeTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => updateParams({ postType: tab.value })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                postType === tab.value
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => updateParams({ status: e.target.value })}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 hover:bg-white transition-colors"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="DRAFT">پیش‌نویس</option>
            <option value="PUBLISHED">منتشر شده</option>
          </select>

          {/* Search with debounce */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="جستجو در عنوان مطالب..."
              className="w-full pr-11 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 hover:bg-white transition-colors"
            />
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {bulkDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              حذف {selectedIds.size.toLocaleString('fa-IR')} مورد
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-right px-5 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === articles.length && articles.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs">
                    مطلب
                  </th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs">
                    نوع
                  </th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs">
                    نویسنده
                  </th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs">
                    دسته‌بندی
                  </th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs">
                    وضعیت
                  </th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs">
                    تاریخ
                  </th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs">
                    بازدید
                  </th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-xs w-20">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {articles.map((article) => (
                  <tr
                    key={article.id}
                    className={`transition-colors ${
                      selectedIds.has(article.id)
                        ? 'bg-blue-50/50'
                        : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(article.id)}
                        onChange={() => toggleSelect(article.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                          {article.image ? (
                            <Image
                              src={article.image}
                              alt={article.title}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/articles/${article.id}`}
                            className="font-medium text-gray-800 hover:text-blue-600 transition-colors line-clamp-1 block"
                          >
                            {article.title}
                          </Link>
                          <span className="text-xs text-gray-400">#{article.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
                        postTypeColors[article.postType] || 'bg-gray-100 text-gray-700'
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
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
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
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {formatDate(article.publishedAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Eye className="w-3.5 h-3.5 text-gray-400" />
                        {article.viewCount.toLocaleString('fa-IR')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/articles/${article.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title="ویرایش"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
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
                      colSpan={9}
                      className="px-5 py-12 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                          <Search className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">مطلبی یافت نشد</p>
                        <p className="text-gray-400 text-xs mt-1">فیلترها را تغییر دهید یا مطلب جدیدی ایجاد کنید</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-5 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              صفحه {page.toLocaleString('fa-IR')} از{' '}
              {totalPages.toLocaleString('fa-IR')}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateParams({ page: (page - 1).toString() })}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
                قبلی
              </button>

              {/* Page numbers */}
              <div className="hidden sm:flex items-center gap-1 mx-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => updateParams({ page: pageNum.toString() })}
                      className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum.toLocaleString('fa-IR')}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => updateParams({ page: (page + 1).toString() })}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                بعدی
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
