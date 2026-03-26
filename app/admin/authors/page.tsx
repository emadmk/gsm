'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import MediaUpload from '@/components/admin/MediaUpload'

interface Author {
  id: number
  name: string
  slug: string
  email: string | null
  bio: string | null
  avatar: string | null
  label: string | null
  _count: { articles: number }
}

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    slug: '',
    email: '',
    bio: '',
    avatar: '',
    label: '',
  })

  const fetchAuthors = useCallback(async () => {
    try {
      const res = await fetch('/api/authors')
      const data = await res.json()
      setAuthors(Array.isArray(data) ? data : [])
    } catch {
      // error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAuthors()
  }, [fetchAuthors])

  const resetForm = () => {
    setForm({ name: '', slug: '', email: '', bio: '', avatar: '', label: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (author: Author) => {
    setForm({
      name: author.name,
      slug: author.slug,
      email: author.email || '',
      bio: author.bio || '',
      avatar: author.avatar || '',
      label: author.label || '',
    })
    setEditingId(author.id)
    setShowForm(true)
  }

  const slugify = (text: string) =>
    text
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\u0600-\u06FFa-zA-Z0-9\-]/g, '')
      .toLowerCase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        email: form.email || undefined,
        bio: form.bio || undefined,
        avatar: form.avatar || undefined,
        label: form.label || undefined,
      }

      const url = editingId ? `/api/authors/${editingId}` : '/api/authors'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        resetForm()
        fetchAuthors()
      }
    } catch {
      // error
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این نویسنده اطمینان دارید؟')) return
    try {
      const res = await fetch(`/api/authors/${id}`, { method: 'DELETE' })
      if (res.ok) fetchAuthors()
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
        <h1 className="text-2xl font-bold text-gray-800">نویسندگان</h1>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          نویسنده جدید
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              {editingId ? 'ویرایش نویسنده' : 'نویسنده جدید'}
            </h2>
            <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نام *
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                    slug: editingId ? form.slug : slugify(e.target.value),
                  })
                }
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="نام نویسنده"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسلاگ *
              </label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                dir="ltr"
                placeholder="slug"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ایمیل
              </label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                type="email"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                dir="ltr"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                عنوان / لیبل
              </label>
              <input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="مثلا: سردبیر"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                بیوگرافی
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
                placeholder="بیوگرافی کوتاه نویسنده"
              />
            </div>
            <div className="md:col-span-2">
              <MediaUpload
                value={form.avatar}
                onChange={(url) => setForm({ ...form, avatar: url })}
                label="آواتار"
              />
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
                <th className="text-right px-4 py-3 font-medium text-gray-600">آواتار</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">نام</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">اسلاگ</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ایمیل</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">لیبل</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">مطالب</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {authors.map((author) => (
                <tr key={author.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {author.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={author.avatar}
                        alt={author.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                        {author.name.charAt(0)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{author.name}</td>
                  <td className="px-4 py-3 text-gray-500" dir="ltr">{author.slug}</td>
                  <td className="px-4 py-3 text-gray-500" dir="ltr">{author.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{author.label || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {author._count.articles.toLocaleString('fa-IR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(author)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(author.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {authors.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    نویسنده‌ای وجود ندارد
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
