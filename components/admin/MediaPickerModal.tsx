'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  X,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Film,
  FileIcon,
  Check,
} from 'lucide-react'
import { getImageUrl } from '@/lib/utils'

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
}

interface MediaPickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
  accept?: 'all' | 'images' | 'videos'
}

const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
function toPersianNum(n: number | string): string {
  return String(n).replace(/\d/g, (d) => persianDigits[parseInt(d)])
}

export default function MediaPickerModal({
  open,
  onClose,
  onSelect,
  accept = 'all',
}: MediaPickerModalProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    try {
      const typeMap = { all: 'all', images: 'images', videos: 'videos' }
      const params = new URLSearchParams({
        page: String(page),
        limit: '30',
        type: typeMap[accept],
        sort: 'date-desc',
      })
      if (debouncedSearch) params.set('search', debouncedSearch)

      const res = await fetch(`/api/media?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItems(data.items || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, accept])

  useEffect(() => {
    if (open) {
      fetchMedia()
    }
  }, [open, fetchMedia])

  useEffect(() => {
    if (!open) {
      setSelectedId(null)
      setSearch('')
      setDebouncedSearch('')
      setPage(1)
    }
  }, [open])

  const handleConfirm = () => {
    const item = items.find((i) => i.id === selectedId)
    if (item) {
      onSelect(item.url)
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">انتخاب از کتابخانه رسانه</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {loading ? '...' : `${toPersianNum(total)} فایل`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در رسانه‌ها..."
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <ImageIcon className="w-12 h-12 mb-3" />
              <p className="text-sm">رسانه‌ای یافت نشد</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {items.map((item) => {
                const isSelected = selectedId === item.id
                const isImage = item.mimeType.startsWith('image/')
                const isVideo = item.mimeType.startsWith('video/')

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(isSelected ? null : item.id)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getImageUrl(item.url)}
                        alt={item.altText || item.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : isVideo ? (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Film className="w-8 h-8 text-gray-300" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <FileIcon className="w-8 h-8 text-gray-300" />
                      </div>
                    )}

                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="bg-blue-500 rounded-full p-1">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                      <p className="text-[10px] text-white truncate" dir="ltr">
                        {item.filename}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          {/* Pagination */}
          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-500">
                  {toPersianNum(page)} از {toPersianNum(totalPages)}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Confirm */}
          <button
            onClick={handleConfirm}
            disabled={selectedId === null}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-4 h-4" />
            انتخاب
          </button>
        </div>
      </div>
    </div>
  )
}
