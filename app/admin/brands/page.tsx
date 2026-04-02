'use client'

 import { useEffect, useState, useCallback } from 'react'
 import { Plus, Pencil, Trash2, X, Loader2, Search } from 'lucide-react'
 import MediaUpload from '@/components/admin/MediaUpload'
 import { getImageUrl } from '@/lib/utils'

interface Brand {
  id: number
  name: string
  nameEn: string | null
  slug: string
  logo: string | null
  description: string | null
  priority: number
  viewCount: number
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
   const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    nameEn: '',
    slug: '',
    logo: '',
    description: '',
    priority: 0,
  })

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch('/api/brands')
       if (!res.ok) {
         const data = await res.json().catch(() => ({}))
         throw new Error(data.error || `خطا: ${res.status}`)
       }
      const data = await res.json()
      setBrands(Array.isArray(data) ? data : [])
       setError(null)
    } catch {
       setError('خطا در دریافت برندها. لطفاً صفحه را بارگذاری مجدد کنید.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  const resetForm = () => {
    setForm({ name: '', nameEn: '', slug: '', logo: '', description: '', priority: 0 })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (brand: Brand) => {
    setForm({
      name: brand.name,
      nameEn: brand.nameEn || '',
      slug: brand.slug,
      logo: brand.logo || '',
      description: brand.description || '',
      priority: brand.priority,
    })
    setEditingId(brand.id)
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
        nameEn: form.nameEn || undefined,
        slug: form.slug,
        logo: form.logo || undefined,
        description: form.description || undefined,
        priority: form.priority,
      }

      const url = editingId ? `/api/brands/${editingId}` : '/api/brands'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
         setError(null)
        resetForm()
        fetchBrands()
       } else {
         const data = await res.json().catch(() => ({}))
         setError(data.error || 'خطا در ذخیره برند')
      }
    } catch {
       setError('خطا در ارتباط با سرور')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این برند اطمینان دارید؟')) return
    try {
      const res = await fetch(`/api/brands/${id}`, { method: 'DELETE' })
      if (res.ok) fetchBrands()
    } catch {
      // error
    }
  }

  const filteredBrands = brands.filter(
    (b) =>
      b.name.includes(search) ||
      (b.nameEn && b.nameEn.toLowerCase().includes(search.toLowerCase())) ||
      b.slug.toLowerCase().includes(search.toLowerCase())
  )

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
        <h1 className="text-2xl font-bold text-gray-800">برندها</h1>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          برند جدید
        </button>
      </div>

       {error && (
         <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center justify-between">
           <span>{error}</span>
           <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
             <X className="w-4 h-4" />
           </button>
         </div>
       )}
 
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="جستجوی برند..."
        />
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              {editingId ? 'ویرایش برند' : 'برند جدید'}
            </h2>
            <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نام فارسی *
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
                placeholder="نام برند"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نام انگلیسی
              </label>
              <input
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                dir="ltr"
                placeholder="Brand Name"
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
                placeholder="brand-slug"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اولویت
              </label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                dir="ltr"
                placeholder="0"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                توضیحات
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
                placeholder="توضیحات برند"
              />
            </div>
            <div className="md:col-span-2">
              <MediaUpload
                value={form.logo}
                onChange={(url) => setForm({ ...form, logo: url })}
                label="لوگو"
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
                <th className="text-right px-4 py-3 font-medium text-gray-600">لوگو</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">نام فارسی</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">نام انگلیسی</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">اسلاگ</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">اولویت</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">بازدید</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBrands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {brand.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                         src={getImageUrl(brand.logo)}
                        alt={brand.name}
                        className="w-8 h-8 rounded object-contain bg-gray-50"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                        {brand.name.charAt(0)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{brand.name}</td>
                  <td className="px-4 py-3 text-gray-500" dir="ltr">{brand.nameEn || '-'}</td>
                  <td className="px-4 py-3 text-gray-500" dir="ltr">{brand.slug}</td>
                  <td className="px-4 py-3 text-gray-600">{brand.priority.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3 text-gray-600">{brand.viewCount.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(brand)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(brand.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBrands.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    برندی یافت نشد
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
