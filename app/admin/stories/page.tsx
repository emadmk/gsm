'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  GripVertical,
  Search,
  ImageIcon,
} from 'lucide-react'
import MediaUpload from '@/components/admin/MediaUpload'
import MediaPickerModal from '@/components/admin/MediaPickerModal'
import { getImageUrl } from '@/lib/utils'

interface StoryItem {
  type: 'image' | 'video'
  url: string
  caption?: string
}

interface Story {
  id: number
  title: string
  cover: string | null
  items: StoryItem[] | null
  order: number
  isActive: boolean
  createdAt: string
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')

   const [pickerOpen, setPickerOpen] = useState(false)
   const [pickerTarget, setPickerTarget] = useState<
     { type: 'cover' } | { type: 'item'; index: number } | null
   >(null)
 
  const [form, setForm] = useState({
    title: '',
    cover: '',
    items: [] as StoryItem[],
    order: 0,
    isActive: true,
  })

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch('/api/stories')
      const data = await res.json()
      setStories(Array.isArray(data) ? data : [])
    } catch {
      // error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStories()
  }, [fetchStories])

  const resetForm = () => {
    setForm({ title: '', cover: '', items: [], order: 0, isActive: true })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (story: Story) => {
    setForm({
      title: story.title,
      cover: story.cover || '',
      items: (story.items as StoryItem[]) || [],
      order: story.order,
      isActive: story.isActive,
    })
    setEditingId(story.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        title: form.title,
        cover: form.cover || undefined,
        items: form.items,
        order: form.order,
        isActive: form.isActive,
      }

      const url = editingId ? `/api/stories/${editingId}` : '/api/stories'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        resetForm()
        fetchStories()
      }
    } catch {
      // error
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این استوری اطمینان دارید؟')) return
    try {
      const res = await fetch(`/api/stories/${id}`, { method: 'DELETE' })
      if (res.ok) fetchStories()
    } catch {
      // error
    }
  }

  const handleToggleActive = async (story: Story) => {
    try {
      await fetch(`/api/stories/${story.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !story.isActive }),
      })
      fetchStories()
    } catch {
      // error
    }
  }

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { type: 'image', url: '', caption: '' }],
    })
  }

  const removeItem = (index: number) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index),
    })
  }

  const updateItem = (index: number, updates: Partial<StoryItem>) => {
    const newItems = [...form.items]
    newItems[index] = { ...newItems[index], ...updates }
    setForm({ ...form, items: newItems })
  }

  const openPickerForCover = () => {
    setPickerTarget({ type: 'cover' })
    setPickerOpen(true)
  }

  const openPickerForItem = (index: number) => {
    setPickerTarget({ type: 'item', index })
    setPickerOpen(true)
  }

  const handlePickerSelect = (url: string) => {
    if (!pickerTarget) return
    if (pickerTarget.type === 'cover') {
      setForm({ ...form, cover: url })
    } else {
      updateItem(pickerTarget.index, { url })
    }
    setPickerTarget(null)
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
        <h1 className="text-2xl font-bold text-gray-800">استوری‌ها</h1>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          استوری جدید
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

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              {editingId ? 'ویرایش استوری' : 'استوری جدید'}
            </h2>
            <button
              onClick={resetForm}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  عنوان *
                </label>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="عنوان استوری"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ترتیب
                </label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) =>
                    setForm({ ...form, order: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <MediaUpload
                value={form.cover}
                onChange={(url) => setForm({ ...form, cover: url })}
                label="کاور استوری"
              />
              <button
                type="button"
                onClick={openPickerForCover}
                className="mt-2 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                انتخاب از کتابخانه رسانه
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                id="storyIsActive"
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="storyIsActive" className="text-sm font-medium text-gray-700">
                فعال
              </label>
            </div>

            {/* Story Items */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                آیتم‌های استوری
              </label>
              <div className="space-y-3">
                {form.items.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <GripVertical className="w-4 h-4" />
                        <span className="text-sm">
                          آیتم {(index + 1).toLocaleString('fa-IR')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          نوع
                        </label>
                        <select
                          value={item.type}
                          onChange={(e) =>
                            updateItem(index, {
                              type: e.target.value as 'image' | 'video',
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                          <option value="image">تصویر</option>
                          <option value="video">ویدیو</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          کپشن
                        </label>
                        <input
                          value={item.caption || ''}
                          onChange={(e) =>
                            updateItem(index, { caption: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="توضیح"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        آدرس فایل
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={item.url}
                          onChange={(e) =>
                            updateItem(index, { url: e.target.value })
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          dir="ltr"
                          placeholder="https://..."
                        />
                        <button
                          type="button"
                          onClick={() => openPickerForItem(index)}
                          className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors whitespace-nowrap"
                        >
                          <ImageIcon className="w-4 h-4" />
                          کتابخانه
                        </button>
                      </div>
                      {item.url && item.type === 'image' && (
                        <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getImageUrl(item.url)}
                            alt={item.caption || ''}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center"
                >
                  <Plus className="w-4 h-4" />
                  افزودن آیتم
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? 'بروزرسانی' : 'ذخیره'}
            </button>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-gray-600">کاور</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">عنوان</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">آیتم‌ها</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ترتیب</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">وضعیت</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stories.filter((story) =>
                story.title.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((story) => (
                <tr key={story.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {story.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getImageUrl(story.cover)}
                        alt={story.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                        بدون تصویر
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{story.title}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {((story.items as StoryItem[]) || []).length.toLocaleString('fa-IR')}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {story.order.toLocaleString('fa-IR')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(story)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${
                        story.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {story.isActive ? 'فعال' : 'غیرفعال'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(story)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(story.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {stories.filter((story) =>
                story.title.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    استوری‌ای وجود ندارد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

       <MediaPickerModal
         open={pickerOpen}
         onClose={() => { setPickerOpen(false); setPickerTarget(null) }}
         onSelect={handlePickerSelect}
       />
     </div>
  )
}
