'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Loader2, Search } from 'lucide-react'
import MediaUpload from '@/components/admin/MediaUpload'

interface Ad {
  id: number
  zone: string
  title: string | null
  content: string | null
  imageUrl: string | null
  linkUrl: string | null
  isActive: boolean
  order: number
}

const adZones = [
  { value: 'home_header', label: 'صفحه اصلی - هدر' },
  { value: 'home_middle', label: 'صفحه اصلی - میانی' },
  { value: 'home_footer', label: 'صفحه اصلی - فوتر' },
  { value: 'news_header', label: 'اخبار - هدر' },
  { value: 'news_middle', label: 'اخبار - میانی' },
  { value: 'news_footer', label: 'اخبار - فوتر' },
  { value: 'article_header', label: 'مقالات - هدر' },
  { value: 'article_middle', label: 'مقالات - میانی' },
  { value: 'article_footer', label: 'مقالات - فوتر' },
  { value: 'sidebar_top', label: 'سایدبار بالا' },
  { value: 'sidebar_bottom', label: 'سایدبار پایین' },
  { value: 'between_posts', label: 'بین مطالب' },
  { value: 'popup', label: 'پاپ‌آپ' },
]

const zoneLabels: Record<string, string> = Object.fromEntries(
  adZones.map((z) => [z.value, z.label])
)

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterZone, setFilterZone] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [form, setForm] = useState({
    zone: 'header',
    title: '',
    imageUrl: '',
    linkUrl: '',
    isActive: true,
    order: 0,
  })

  const fetchAds = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterZone) params.set('zone', filterZone)
      const res = await fetch(`/api/ads?${params}`)
      const data = await res.json()
      setAds(Array.isArray(data) ? data : [])
    } catch {
      // error
    } finally {
      setLoading(false)
    }
  }, [filterZone])

  useEffect(() => {
    fetchAds()
  }, [fetchAds])

  const resetForm = () => {
    setForm({
      zone: 'header',
      title: '',
      imageUrl: '',
      linkUrl: '',
      isActive: true,
      order: 0,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (ad: Ad) => {
    setForm({
      zone: ad.zone,
      title: ad.title || '',
      imageUrl: ad.imageUrl || '',
      linkUrl: ad.linkUrl || '',
      isActive: ad.isActive,
      order: ad.order,
    })
    setEditingId(ad.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        zone: form.zone,
        title: form.title || undefined,
        imageUrl: form.imageUrl || undefined,
        linkUrl: form.linkUrl || undefined,
        isActive: form.isActive,
        order: form.order,
      }

      const url = editingId ? `/api/ads/${editingId}` : '/api/ads'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        resetForm()
        fetchAds()
      }
    } catch {
      // error
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این تبلیغ اطمینان دارید؟')) return
    try {
      const res = await fetch(`/api/ads/${id}`, { method: 'DELETE' })
      if (res.ok) fetchAds()
    } catch {
      // error
    }
  }

  const handleToggleActive = async (ad: Ad) => {
    try {
      await fetch(`/api/ads/${ad.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !ad.isActive }),
      })
      fetchAds()
    } catch {
      // error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">تبلیغات</h1>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          تبلیغ جدید
        </button>
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

      {/* Zone filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterZone('')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            filterZone === ''
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          همه
        </button>
        {adZones.map((zone) => (
          <button
            key={zone.value}
            onClick={() => setFilterZone(zone.value)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filterZone === zone.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {zone.label}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              {editingId ? 'ویرایش تبلیغ' : 'تبلیغ جدید'}
            </h2>
            <button
              onClick={resetForm}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                موقعیت *
              </label>
              <select
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {adZones.map((zone) => (
                  <option key={zone.value} value={zone.value}>
                    {zone.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                عنوان
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="عنوان تبلیغ"
              />
            </div>
            <div>
              <MediaUpload
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                label="تصویر تبلیغ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                لینک (URL)
              </label>
              <input
                value={form.linkUrl}
                onChange={(e) =>
                  setForm({ ...form, linkUrl: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                dir="ltr"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ترتیب
              </label>
              <input
                value={form.order}
                onChange={(e) =>
                  setForm({ ...form, order: parseInt(e.target.value) || 0 })
                }
                type="number"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="0"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">فعال</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'بروزرسانی' : 'ذخیره'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-gray-600">تصویر</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">عنوان</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">موقعیت</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">لینک</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ترتیب</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">وضعیت</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ads.filter((ad) =>
                (ad.title && ad.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (!searchQuery)
              ).map((ad) => (
                <tr key={ad.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {ad.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ad.imageUrl}
                        alt={ad.title || 'تبلیغ'}
                        className="w-16 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-16 h-10 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                        بدون تصویر
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {ad.title || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                      {zoneLabels[ad.zone] || ad.zone}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate" dir="ltr">
                    {ad.linkUrl ? (
                      <a
                        href={ad.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {ad.linkUrl}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {ad.order.toLocaleString('fa-IR')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(ad)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${
                        ad.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {ad.isActive ? 'فعال' : 'غیرفعال'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(ad)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {ads.filter((ad) =>
                (ad.title && ad.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (!searchQuery)
              ).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    تبلیغی وجود ندارد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
