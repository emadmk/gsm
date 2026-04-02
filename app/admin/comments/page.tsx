'use client'

 import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Check,
  X,
  Trash2,
  MessageSquare,
  Loader2,
  Reply,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Search,
} from 'lucide-react'

interface Comment {
  id: number
  authorName: string
  authorEmail: string | null
  content: string
  isApproved: boolean
  isAdmin: boolean
  createdAt: string
  article: {
    id: number
    title: string
    slug: string
  }
  replies: Array<{
    id: number
    authorName: string
    content: string
    isApproved: boolean
    isAdmin: boolean
    createdAt: string
  }>
}

interface PaginatedResponse {
  comments: Comment[]
  total: number
  page: number
  totalPages: number
}

type FilterType = 'all' | 'pending' | 'approved'

const ITEMS_PER_PAGE = 10

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchComments = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', page.toString())
    params.set('limit', ITEMS_PER_PAGE.toString())
    if (filter === 'pending') params.set('isApproved', 'false')
    if (filter === 'approved') params.set('isApproved', 'true')
     if (debouncedSearch) params.set('search', debouncedSearch)

    try {
      const res = await fetch(`/api/comments?${params}`)
      const data = await res.json()

       const paginated = data as PaginatedResponse
       setComments(paginated.comments || [])
       setTotal(paginated.total || 0)
       setTotalPages(paginated.totalPages || 0)
    } catch {
      setComments([])
    } finally {
      setLoading(false)
    }
   }, [filter, page, debouncedSearch])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

   // Debounce search
   useEffect(() => {
     if (debounceRef.current) clearTimeout(debounceRef.current)
     debounceRef.current = setTimeout(() => {
       setDebouncedSearch(searchQuery)
       setPage(1)
     }, 400)
     return () => {
       if (debounceRef.current) clearTimeout(debounceRef.current)
     }
   }, [searchQuery])

  useEffect(() => {
    setPage(1)
  }, [filter])

  const handleApprove = async (id: number) => {
    setActionLoading(id)
    try {
      await fetch(`/api/comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true }),
      })
      fetchComments()
    } catch {
      // error
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: number) => {
    setActionLoading(id)
    try {
      await fetch(`/api/comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: false }),
      })
      fetchComments()
    } catch {
      // error
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این نظر اطمینان دارید؟')) return
    setActionLoading(id)
    try {
      await fetch(`/api/comments/${id}`, { method: 'DELETE' })
      fetchComments()
    } catch {
      // error
    } finally {
      setActionLoading(null)
    }
  }

  const handleReply = async (commentId: number, articleId: number) => {
    if (!replyContent.trim()) return
    setSubmittingReply(true)

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: 'مدیر سایت',
          content: replyContent,
          articleId,
          parentId: commentId,
        }),
      })

      if (res.ok) {
        const newComment = await res.json()
        await fetch(`/api/comments/${newComment.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isApproved: true, isAdmin: true }),
        })
        setReplyContent('')
        setReplyingTo(null)
        fetchComments()
      }
    } catch {
      // error
    } finally {
      setSubmittingReply(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filterTabs: Array<{ value: FilterType; label: string; count?: number }> = [
    { value: 'all', label: 'همه' },
    { value: 'pending', label: 'در انتظار تایید' },
    { value: 'approved', label: 'تایید شده' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">مدیریت نظرات</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total.toLocaleString('fa-IR')} نظر یافت شد
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجو..."
          className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Filter tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-1.5 inline-flex gap-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === tab.value
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : comments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">نظری یافت نشد</p>
          <p className="text-gray-400 text-sm mt-1">نظرات جدید اینجا نمایش داده خواهند شد</p>
        </div>
      ) : (
        <div className="space-y-4">
           {comments.map((comment) => (
            <div
              key={comment.id}
              className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-md ${
                comment.isApproved
                  ? 'border-gray-100'
                  : 'border-amber-200 ring-1 ring-amber-100'
              }`}
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                      comment.isApproved ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-amber-400 to-orange-500'
                    }`}>
                      {comment.authorName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">
                          {comment.authorName}
                        </span>
                        {!comment.isApproved && (
                          <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            در انتظار تایید
                          </span>
                        )}
                        {comment.isApproved && (
                          <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            تایید شده
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                        {comment.authorEmail && (
                          <span dir="ltr">{comment.authorEmail}</span>
                        )}
                        <span>{formatDate(comment.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {!comment.isApproved && (
                      <button
                        onClick={() => handleApprove(comment.id)}
                        disabled={actionLoading === comment.id}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors disabled:opacity-50"
                        title="تایید"
                      >
                        {actionLoading === comment.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {comment.isApproved && (
                      <button
                        onClick={() => handleReject(comment.id)}
                        disabled={actionLoading === comment.id}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors disabled:opacity-50"
                        title="رد کردن"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setReplyingTo(replyingTo === comment.id ? null : comment.id)
                      }
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      title="پاسخ"
                    >
                      <Reply className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={actionLoading === comment.id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Article link */}
                <Link
                  href={`/admin/articles/${comment.article.id}`}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg mb-3 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  {comment.article.title}
                </Link>

                {/* Content */}
                <p className="text-sm text-gray-700 leading-7 whitespace-pre-line bg-gray-50/50 rounded-xl p-3">
                  {comment.content}
                </p>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 pr-4 border-r-2 border-blue-200 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                              reply.isAdmin ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gray-400'
                            }`}>
                              {reply.authorName.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {reply.authorName}
                            </span>
                            {reply.isAdmin && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                                مدیر
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {formatDate(reply.createdAt)}
                            </span>
                            <button
                              onClick={() => handleDelete(reply.id)}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-6 pr-9">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply form */}
                {replyingTo === comment.id && (
                  <div className="mt-4 pr-4 border-r-2 border-blue-400">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y bg-gray-50/50"
                      placeholder="پاسخ خود را بنویسید..."
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() =>
                          handleReply(comment.id, comment.article.id)
                        }
                        disabled={submittingReply || !replyContent.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-500/25"
                      >
                        {submittingReply && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        ارسال پاسخ
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyContent('')
                        }}
                        className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            صفحه {page.toLocaleString('fa-IR')} از{' '}
            {totalPages.toLocaleString('fa-IR')}
            <span className="text-gray-400 mr-2">
              ({total.toLocaleString('fa-IR')} نظر)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              قبلی
            </button>

            {/* Page numbers */}
            <div className="hidden sm:flex items-center gap-1">
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
                    onClick={() => setPage(pageNum)}
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
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
  )
}
   const [debouncedSearch, setDebouncedSearch] = useState('')
   const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
