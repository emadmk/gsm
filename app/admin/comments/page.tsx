'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Check,
  X,
  Trash2,
  MessageSquare,
  Loader2,
  Reply,
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

type FilterType = 'all' | 'pending' | 'approved'

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  const fetchComments = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter === 'pending') params.set('isApproved', 'false')
    if (filter === 'approved') params.set('isApproved', 'true')

    try {
      const res = await fetch(`/api/comments?${params}`)
      const data = await res.json()
      // Filter to only root comments (no parentId)
      const rootComments = (Array.isArray(data) ? data : []).filter(
        (c: Comment & { parentId?: number | null }) => !c.parentId
      )
      setComments(rootComments)
    } catch {
      // error
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleApprove = async (id: number) => {
    try {
      await fetch(`/api/comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true }),
      })
      fetchComments()
    } catch {
      // error
    }
  }

  const handleReject = async (id: number) => {
    try {
      await fetch(`/api/comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: false }),
      })
      fetchComments()
    } catch {
      // error
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این نظر اطمینان دارید؟')) return
    try {
      await fetch(`/api/comments/${id}`, { method: 'DELETE' })
      fetchComments()
    } catch {
      // error
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
        // Auto-approve admin reply
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

  const filterTabs: Array<{ value: FilterType; label: string }> = [
    { value: 'all', label: 'همه' },
    { value: 'pending', label: 'در انتظار تایید' },
    { value: 'approved', label: 'تایید شده' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">نظرات</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          نظری وجود ندارد
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                comment.isApproved
                  ? 'border-gray-200'
                  : 'border-yellow-300 bg-yellow-50/30'
              }`}
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">
                        {comment.authorName}
                      </span>
                      {!comment.isApproved && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                          در انتظار تایید
                        </span>
                      )}
                      {comment.isApproved && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          تایید شده
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {comment.authorEmail && (
                        <span dir="ltr">{comment.authorEmail} | </span>
                      )}
                      {formatDate(comment.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!comment.isApproved && (
                      <button
                        onClick={() => handleApprove(comment.id)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="تایید"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {comment.isApproved && (
                      <button
                        onClick={() => handleReject(comment.id)}
                        className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                        title="رد کردن"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setReplyingTo(
                          replyingTo === comment.id ? null : comment.id
                        )
                      }
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="پاسخ"
                    >
                      <Reply className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Article link */}
                <div className="text-xs text-gray-500 mb-2">
                  برای مطلب:{' '}
                  <span className="text-blue-600">{comment.article.title}</span>
                </div>

                {/* Content */}
                <p className="text-sm text-gray-700 leading-6 whitespace-pre-line">
                  {comment.content}
                </p>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 pr-4 border-r-2 border-gray-200 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">
                              {reply.authorName}
                            </span>
                            {reply.isAdmin && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                مدیر
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDelete(reply.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 leading-6">
                          {reply.content}
                        </p>
                        <span className="text-xs text-gray-400">
                          {formatDate(reply.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply form */}
                {replyingTo === comment.id && (
                  <div className="mt-4 pr-4 border-r-2 border-blue-300">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
                      placeholder="پاسخ خود را بنویسید..."
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() =>
                          handleReply(comment.id, comment.article.id)
                        }
                        disabled={submittingReply || !replyContent.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
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
    </div>
  )
}
