'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Trash2,
  Loader2,
  Mail,
  MailOpen,
  X,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react'

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  isRead: boolean
  createdAt: string
}

interface PaginatedResponse {
  messages: ContactMessage[]
  total: number
  page: number
  totalPages: number
}

const ITEMS_PER_PAGE = 10

export default function ContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', ITEMS_PER_PAGE.toString())

      const res = await fetch(`/api/contact?${params}`)
      const data: PaginatedResponse = await res.json()

      setMessages(data.messages || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 0)
    } catch {
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const handleToggleRead = async (msg: ContactMessage) => {
    setActionLoading(msg.id)
    try {
      await fetch(`/api/contact/${msg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !msg.isRead }),
      })
      fetchMessages()
      if (selectedMessage?.id === msg.id) {
        setSelectedMessage({ ...msg, isRead: !msg.isRead })
      }
    } catch {
      // error
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این پیام اطمینان دارید؟')) return
    setActionLoading(id)
    try {
      const res = await fetch(`/api/contact/${id}`, { method: 'DELETE' })
      if (res.ok) {
        if (selectedMessage?.id === id) setSelectedMessage(null)
        fetchMessages()
      }
    } catch {
      // error
    } finally {
      setActionLoading(null)
    }
  }

  const handleOpenMessage = async (msg: ContactMessage) => {
    setSelectedMessage(msg)
    if (!msg.isRead) {
      try {
        await fetch(`/api/contact/${msg.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true }),
        })
        fetchMessages()
      } catch {
        // error
      }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">پیام‌های تماس</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total.toLocaleString('fa-IR')} پیام
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">پیامی یافت نشد</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">نام</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">ایمیل</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">موضوع</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">تاریخ</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">وضعیت</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {messages.map((msg) => (
                  <tr
                    key={msg.id}
                    className={`hover:bg-gray-50 cursor-pointer ${!msg.isRead ? 'bg-blue-50/40' : ''}`}
                    onClick={() => handleOpenMessage(msg)}
                  >
                    <td className="px-4 py-3 font-medium">
                      {msg.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500" dir="ltr">
                      {msg.email}
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                      {msg.subject}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(msg.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {msg.isRead ? (
                        <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                          خوانده شده
                        </span>
                      ) : (
                        <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          جدید
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleRead(msg)}
                          disabled={actionLoading === msg.id}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                          title={msg.isRead ? 'علامت به عنوان خوانده نشده' : 'علامت به عنوان خوانده شده'}
                        >
                          {actionLoading === msg.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : msg.isRead ? (
                            <Mail className="w-4 h-4" />
                          ) : (
                            <MailOpen className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(msg.id)}
                          disabled={actionLoading === msg.id}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            صفحه {page.toLocaleString('fa-IR')} از{' '}
            {totalPages.toLocaleString('fa-IR')}
            <span className="text-gray-400 mr-2">
              ({total.toLocaleString('fa-IR')} پیام)
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

      {/* Message Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">جزئیات پیام</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <span className="text-xs text-gray-500">نام</span>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{selectedMessage.name}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">ایمیل</span>
                <p className="text-sm text-gray-800 mt-0.5" dir="ltr">{selectedMessage.email}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">موضوع</span>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{selectedMessage.subject}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">تاریخ</span>
                <p className="text-sm text-gray-800 mt-0.5">{formatDate(selectedMessage.createdAt)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">پیام</span>
                <p className="text-sm text-gray-700 mt-1 leading-7 whitespace-pre-line bg-gray-50 rounded-lg p-3">
                  {selectedMessage.message}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-5 border-t border-gray-200">
              <button
                onClick={() => handleToggleRead(selectedMessage)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                {selectedMessage.isRead ? (
                  <>
                    <Mail className="w-4 h-4" />
                    علامت به عنوان خوانده نشده
                  </>
                ) : (
                  <>
                    <MailOpen className="w-4 h-4" />
                    علامت به عنوان خوانده شده
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  handleDelete(selectedMessage.id)
                  setSelectedMessage(null)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
