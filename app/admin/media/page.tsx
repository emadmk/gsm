'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Grid3X3,
  List,
  Search,
  Upload,
  X,
  Trash2,
  Check,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Image as ImageIcon,
  Film,
  FileIcon,
  Copy,
  ExternalLink,
  Calendar,
  HardDrive,
  Maximize2,
  Settings,
  AlertCircle,
  CloudUpload,
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────
interface MediaItem {
  id: number
  filename: string
  originalName: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  altText: string | null
  url: string
  path: string
  createdAt: string
  updatedAt: string
}

interface MediaResponse {
  items: MediaItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

type ViewMode = 'grid' | 'list'
type FileTypeFilter = 'all' | 'images' | 'videos'
type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-asc' | 'size-desc'

// ─── Helpers ─────────────────────────────────────────────────
const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
function toPersianNum(n: number | string): string {
  return String(n).replace(/\d/g, (d) => persianDigits[parseInt(d)])
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return toPersianNum(bytes) + ' بایت'
  if (bytes < 1024 * 1024) return toPersianNum((bytes / 1024).toFixed(1)) + ' کیلوبایت'
  if (bytes < 1024 * 1024 * 1024) return toPersianNum((bytes / (1024 * 1024)).toFixed(1)) + ' مگابایت'
  return toPersianNum((bytes / (1024 * 1024 * 1024)).toFixed(2)) + ' گیگابایت'
}

function formatPersianDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return dateStr
  }
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

function isVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}

function getFileTypeLabel(mimeType: string): string {
  if (isImage(mimeType)) return 'تصویر'
  if (isVideo(mimeType)) return 'ویدیو'
  return 'فایل'
}

// ─── Toast ───────────────────────────────────────────────────
interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up cursor-pointer transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toast.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-blue-600 text-white'
          }`}
          onClick={() => onDismiss(toast.id)}
        >
          {toast.type === 'success' && <Check className="w-4 h-4 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.message}
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────
export default function MediaLibraryPage() {
  // State
  const [items, setItems] = useState<MediaItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<FileTypeFilter>('all')
  const [sort, setSort] = useState<SortOption>('date-desc')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null)
  const [editFilename, setEditFilename] = useState('')
  const [editAltText, setEditAltText] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toastIdRef = useRef(0)

  // ─── Toast helpers ───
  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastIdRef.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // ─── Debounced search ───
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // ─── Fetch media ───
  const fetchMedia = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '40',
        type: typeFilter,
        sort,
      })
      if (debouncedSearch) params.set('search', debouncedSearch)

      const res = await fetch(`/api/media?${params}`)
      if (!res.ok) throw new Error('Fetch failed')
      const data: MediaResponse = await res.json()
      setItems(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      addToast('خطا در دریافت رسانه‌ها', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, typeFilter, sort, addToast])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  // ─── Upload ───
  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      if (fileArray.length === 0) return

      setUploading(true)
      setUploadProgress(0)
      let uploaded = 0
      let failed = 0

      for (const file of fileArray) {
        try {
          const formData = new FormData()
          formData.append('file', file)
          const res = await fetch('/api/media', {
            method: 'POST',
            body: formData,
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || 'Upload failed')
          }
          uploaded++
        } catch (err) {
          failed++
          addToast(
            `خطا در آپلود ${file.name}: ${err instanceof Error ? err.message : 'خطای ناشناخته'}`,
            'error'
          )
        }
        setUploadProgress(Math.round(((uploaded + failed) / fileArray.length) * 100))
      }

      setUploading(false)
      setUploadProgress(0)

      if (uploaded > 0) {
        addToast(`${toPersianNum(uploaded)} فایل با موفقیت آپلود شد`, 'success')
        setPage(1)
        fetchMedia()
      }
    },
    [addToast, fetchMedia]
  )

  // ─── Drag & drop ───
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (e.dataTransfer.files.length > 0) {
        uploadFiles(e.dataTransfer.files)
      }
    },
    [uploadFiles]
  )

  // ─── Selection ───
  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)))
    }
  }, [items, selectedIds.size])

  // ─── Bulk delete ───
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`آیا از حذف ${toPersianNum(selectedIds.size)} رسانه اطمینان دارید؟`)) return

    setDeleting(true)
    try {
      const res = await fetch('/api/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      if (!res.ok) throw new Error()
      addToast(`${toPersianNum(selectedIds.size)} رسانه حذف شد`, 'success')
      setSelectedIds(new Set())
      setDetailItem(null)
      fetchMedia()
    } catch {
      addToast('خطا در حذف رسانه‌ها', 'error')
    } finally {
      setDeleting(false)
    }
  }, [selectedIds, addToast, fetchMedia])

  // ─── Single delete ───
  const handleDeleteItem = useCallback(
    async (item: MediaItem) => {
      if (!confirm(`آیا از حذف "${item.originalName}" اطمینان دارید؟`)) return

      setDeleting(true)
      try {
        const res = await fetch('/api/media', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [item.id] }),
        })
        if (!res.ok) throw new Error()
        addToast('رسانه حذف شد', 'success')
        setDetailItem(null)
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
        fetchMedia()
      } catch {
        addToast('خطا در حذف رسانه', 'error')
      } finally {
        setDeleting(false)
      }
    },
    [addToast, fetchMedia]
  )

  // ─── Save detail ───
  const handleSaveDetail = useCallback(async () => {
    if (!detailItem) return
    setSaving(true)
    try {
      const res = await fetch('/api/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: detailItem.id,
          filename: editFilename,
          altText: editAltText,
        }),
      })
      if (!res.ok) throw new Error()
      const updated: MediaItem = await res.json()
      setDetailItem(updated)
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      addToast('اطلاعات بروزرسانی شد', 'success')
    } catch {
      addToast('خطا در بروزرسانی', 'error')
    } finally {
      setSaving(false)
    }
  }, [detailItem, editFilename, editAltText, addToast])

  // ─── Open detail ───
  const openDetail = useCallback((item: MediaItem) => {
    setDetailItem(item)
    setEditFilename(item.filename)
    setEditAltText(item.altText || '')
  }, [])

  // ─── Copy URL ───
  const copyUrl = useCallback(
    (url: string) => {
      navigator.clipboard.writeText(url).then(() => {
        addToast('آدرس کپی شد', 'success')
      })
    },
    [addToast]
  )

  // ─── Render ────────────────────────────────────────────────
  return (
    <div
      className="space-y-4"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-50 bg-blue-600/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl p-12 flex flex-col items-center gap-4 animate-pulse">
            <CloudUpload className="w-16 h-16 text-blue-600" />
            <p className="text-xl font-bold text-blue-700">فایل‌ها را رها کنید</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">کتابخانه رسانه</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '...' : `${toPersianNum(total)} فایل`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/media/settings"
            className="flex items-center gap-2 px-4 py-2.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Settings className="w-4 h-4" />
            تنظیمات S3
          </Link>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? `${toPersianNum(uploadProgress)}٪` : 'آپلود فایل'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) uploadFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در رسانه‌ها..."
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as FileTypeFilter)
                setPage(1)
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">همه فایل‌ها</option>
              <option value="images">تصاویر</option>
              <option value="videos">ویدیوها</option>
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortOption)
                setPage(1)
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="date-desc">جدیدترین</option>
              <option value="date-asc">قدیمی‌ترین</option>
              <option value="name-asc">نام (الف-ی)</option>
              <option value="name-desc">نام (ی-الف)</option>
              <option value="size-desc">بزرگ‌ترین</option>
              <option value="size-asc">کوچک‌ترین</option>
            </select>

            {/* View toggle */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk actions bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={selectAll}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              {selectedIds.size === items.length ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedIds.size === items.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
            </button>
            <span className="text-sm text-gray-500">
              {toPersianNum(selectedIds.size)} مورد انتخاب شده
            </span>
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors mr-auto"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              حذف انتخاب‌شده‌ها
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">رسانه‌ای یافت نشد</p>
          <p className="text-gray-400 text-sm mt-2">
            فایل‌ها را بکشید و رها کنید یا از دکمه آپلود استفاده کنید
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ─── Grid View ─── */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {items.map((item) => {
            const selected = selectedIds.has(item.id)
            return (
              <div
                key={item.id}
                className={`group relative bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSelect(item.id)
                  }}
                  className={`absolute top-2 right-2 z-10 w-6 h-6 rounded flex items-center justify-center transition-all ${
                    selected
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/80 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-white hover:text-gray-600'
                  }`}
                >
                  {selected ? <Check className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                </button>

                {/* Preview */}
                <div className="aspect-square bg-gray-50 relative" onClick={() => openDetail(item)}>
                  {isImage(item.mimeType) ? (
                    <img
                      src={item.url}
                      alt={item.altText || item.originalName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : isVideo(item.mimeType) ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <Film className="w-10 h-10 text-gray-400" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <FileIcon className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2" onClick={() => openDetail(item)}>
                  <p className="text-xs text-gray-700 truncate font-medium">{item.originalName}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{formatFileSize(item.size)}</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ─── List View ─── */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="py-3 px-4 text-right font-medium text-gray-600 w-10">
                  <button onClick={selectAll}>
                    {selectedIds.size === items.length && items.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 text-right font-medium text-gray-600 w-14">پیش‌نمایش</th>
                <th className="py-3 px-4 text-right font-medium text-gray-600">نام فایل</th>
                <th className="py-3 px-4 text-right font-medium text-gray-600 hidden md:table-cell">نوع</th>
                <th className="py-3 px-4 text-right font-medium text-gray-600 hidden sm:table-cell">حجم</th>
                <th className="py-3 px-4 text-right font-medium text-gray-600 hidden lg:table-cell">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const selected = selectedIds.has(item.id)
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-50 transition-colors cursor-pointer ${
                      selected ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-2 px-4">
                      <button onClick={() => toggleSelect(item.id)}>
                        {selected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-2 px-4" onClick={() => openDetail(item)}>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {isImage(item.mimeType) ? (
                          <img
                            src={item.url}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : isVideo(item.mimeType) ? (
                          <Film className="w-5 h-5 text-gray-400" />
                        ) : (
                          <FileIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-4" onClick={() => openDetail(item)}>
                      <p className="text-gray-800 font-medium truncate max-w-[200px] lg:max-w-[300px]">
                        {item.originalName}
                      </p>
                    </td>
                    <td className="py-2 px-4 hidden md:table-cell" onClick={() => openDetail(item)}>
                      <span className="text-gray-500 text-xs">{getFileTypeLabel(item.mimeType)}</span>
                    </td>
                    <td className="py-2 px-4 hidden sm:table-cell" onClick={() => openDetail(item)}>
                      <span className="text-gray-500 text-xs">{formatFileSize(item.size)}</span>
                    </td>
                    <td className="py-2 px-4 hidden lg:table-cell" onClick={() => openDetail(item)}>
                      <span className="text-gray-500 text-xs">{formatPersianDate(item.createdAt)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            let pageNum: number
            if (totalPages <= 7) {
              pageNum = i + 1
            } else if (page <= 4) {
              pageNum = i + 1
            } else if (page >= totalPages - 3) {
              pageNum = totalPages - 6 + i
            } else {
              pageNum = page - 3 + i
            }
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  pageNum === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {toPersianNum(pageNum)}
              </button>
            )
          })}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detail Panel / Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDetailItem(null)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col mx-4 animate-scale-in">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">جزئیات رسانه</h2>
              <button
                onClick={() => setDetailItem(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col md:flex-row">
                {/* Preview side */}
                <div className="md:w-1/2 bg-gray-50 flex items-center justify-center p-6 min-h-[250px]">
                  {isImage(detailItem.mimeType) ? (
                    <img
                      src={detailItem.url}
                      alt={detailItem.altText || detailItem.originalName}
                      className="max-w-full max-h-[400px] object-contain rounded-lg shadow-sm"
                    />
                  ) : isVideo(detailItem.mimeType) ? (
                    <video
                      src={detailItem.url}
                      controls
                      className="max-w-full max-h-[400px] rounded-lg shadow-sm"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <FileIcon className="w-20 h-20 text-gray-300" />
                      <span className="text-sm text-gray-500">{detailItem.mimeType}</span>
                    </div>
                  )}
                </div>

                {/* Details side */}
                <div className="md:w-1/2 p-6 space-y-4">
                  {/* Editable filename */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">نام فایل</label>
                    <input
                      value={editFilename}
                      onChange={(e) => setEditFilename(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      dir="ltr"
                    />
                  </div>

                  {/* Alt text */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">متن جایگزین (Alt)</label>
                    <textarea
                      value={editAltText}
                      onChange={(e) => setEditAltText(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    />
                  </div>

                  {/* Meta info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <FileIcon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{detailItem.originalName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <HardDrive className="w-4 h-4 shrink-0" />
                      <span>{formatFileSize(detailItem.size)}</span>
                    </div>
                    {detailItem.width && detailItem.height && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Maximize2 className="w-4 h-4 shrink-0" />
                        <span dir="ltr">
                          {toPersianNum(detailItem.width)} &times; {toPersianNum(detailItem.height)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span className="text-xs">{formatPersianDate(detailItem.createdAt)}</span>
                    </div>
                  </div>

                  {/* URL */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">آدرس فایل</label>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={detailItem.url}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 text-gray-600 outline-none"
                        dir="ltr"
                      />
                      <button
                        onClick={() => copyUrl(detailItem.url)}
                        className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="کپی آدرس"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={detailItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="باز کردن"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => handleDeleteItem(detailItem)}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                حذف
              </button>
              <button
                onClick={handleSaveDetail}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                ذخیره تغییرات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}
