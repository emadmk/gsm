'use client'

 import { useEffect, useState } from 'react'
 import { Save, Plus, Trash2, Loader2, RefreshCw, AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Unlock } from 'lucide-react'

interface SettingEntry {
  key: string
  value: string
  isSecret: boolean
}

const defaultKeys = [
  { key: 'site_title', label: 'عنوان سایت' },
  { key: 'site_description', label: 'توضیحات سایت' },
  { key: 'site_keywords', label: 'کلمات کلیدی' },
  { key: 'site_logo', label: 'لوگو (URL)' },
  { key: 'site_favicon', label: 'فاوآیکون (URL)' },
  { key: 'contact_email', label: 'ایمیل تماس' },
  { key: 'contact_phone', label: 'شماره تماس' },
  { key: 'social_telegram', label: 'تلگرام' },
  { key: 'social_instagram', label: 'اینستاگرام' },
  { key: 'social_twitter', label: 'توییتر (X)' },
  { key: 'social_youtube', label: 'یوتیوب' },
  { key: 'footer_text', label: 'متن فوتر' },
  { key: 'google_analytics', label: 'کد Google Analytics' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newIsSecret, setNewIsSecret] = useState(false)
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set())
  const [migrateLoading, setMigrateLoading] = useState(false)
  const [migrateCheckLoading, setMigrateCheckLoading] = useState(false)
  const [migrateCount, setMigrateCount] = useState<number | null>(null)
  const [migrateResult, setMigrateResult] = useState<string | null>(null)
  const [migrateError, setMigrateError] = useState<string | null>(null)

  const checkMigrateUrls = async () => {
    setMigrateCheckLoading(true)
    setMigrateError(null)
    try {
      const res = await fetch('/api/migrate-urls')
      const data = await res.json()
      setMigrateCount(data.totalArticlesWithOldUrls ?? 0)
    } catch {
      setMigrateError('خطا در بررسی')
    } finally {
      setMigrateCheckLoading(false)
    }
  }

  const runMigrateUrls = async () => {
    if (!confirm('آیا از اجرای بروزرسانی لینک‌ها اطمینان دارید؟ این عملیات قابل بازگشت نیست.')) return
    setMigrateLoading(true)
    setMigrateError(null)
    setMigrateResult(null)
    try {
      const res = await fetch('/api/migrate-urls', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setMigrateResult(data.message)
        setMigrateCount(0)
      } else {
        setMigrateError(data.error || 'خطا در بروزرسانی')
      }
    } catch {
      setMigrateError('خطا در ارتباط با سرور')
    } finally {
      setMigrateLoading(false)
    }
  }

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const serverMap = new Map<string, SettingEntry>(
            data.map((s: SettingEntry) => [s.key, s])
          )
          const entries: SettingEntry[] = []

          for (const dk of defaultKeys) {
            const existing = serverMap.get(dk.key)
            entries.push({ key: dk.key, value: existing?.value || '', isSecret: existing?.isSecret || false })
            serverMap.delete(dk.key)
          }

          for (const [, entry] of serverMap) {
            entries.push(entry)
          }

          setSettings(entries)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (index: number, value: string) => {
    setSettings((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], value }
      return updated
    })
    setSuccess(false)
  }

  const handleAddSetting = () => {
    if (!newKey.trim()) return
    if (settings.some((s) => s.key === newKey.trim())) {
      setError('این کلید قبلا وجود دارد')
      return
    }
    setSettings((prev) => [...prev, { key: newKey.trim(), value: newValue, isSecret: newIsSecret }])
    setNewKey('')
    setNewValue('')
    setNewIsSecret(false)
    setError('')
  }

  const handleRemoveSetting = (index: number) => {
    setSettings((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ذخیره تنظیمات')
      }

      const saved = await res.json()
      if (Array.isArray(saved)) {
        setSettings(saved)
        setVisibleSecrets(new Set())
      }
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره تنظیمات')
    } finally {
      setSaving(false)
    }
  }

  const getLabelForKey = (key: string) => {
    const dk = defaultKeys.find((d) => d.key === key)
    return dk ? dk.label : key
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
        <h1 className="text-2xl font-bold text-gray-800">تنظیمات</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          ذخیره تنظیمات
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          تنظیمات با موفقیت ذخیره شد
        </div>
      )}

      {/* Settings form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        {settings.map((entry, index) => (
          <div key={entry.key} className="flex items-start gap-3">
            <div className="flex-1">
             <label className="block text-sm font-medium text-gray-700 mb-1">
               {getLabelForKey(entry.key)}
               <span className="text-xs text-gray-400 mr-2" dir="ltr">
                 ({entry.key})
               </span>
               {entry.isSecret && (
                 <Lock className="inline w-3.5 h-3.5 mr-1 text-amber-500" />
               )}
             </label>
              {entry.key.includes('description') ||
              entry.key.includes('text') ||
              entry.key.includes('analytics') ? (
                <textarea
                  value={entry.value}
                  onChange={(e) => handleChange(index, e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
                />
             ) : (
                <div className="relative">
                  <input
                    value={entry.value}
                    onChange={(e) => handleChange(index, e.target.value)}
                    type={entry.isSecret && !visibleSecrets.has(entry.key) ? 'password' : 'text'}
                    dir={
                      entry.key.includes('url') ||
                      entry.key.includes('logo') ||
                      entry.key.includes('favicon') ||
                      entry.key.includes('email') ||
                      entry.key.includes('social_') ||
                      entry.key.includes('analytics')
                        ? 'ltr'
                        : 'rtl'
                    }
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${entry.isSecret ? 'pl-10' : ''}`}
                  />
                  {entry.isSecret && (
                    <button
                      type="button"
                      onClick={() => setVisibleSecrets((prev) => {
                        const next = new Set(prev)
                        if (next.has(entry.key)) next.delete(entry.key)
                        else next.add(entry.key)
                        return next
                      })}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title={visibleSecrets.has(entry.key) ? 'مخفی کردن' : 'نمایش'}
                    >
                      {visibleSecrets.has(entry.key) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 mt-7">
              <button
                type="button"
                onClick={() => {
                  setSettings((prev) => {
                    const updated = [...prev]
                    updated[index] = { ...updated[index], isSecret: !updated[index].isSecret }
                    return updated
                  })
                }}
                className={`p-1.5 rounded transition-colors ${
                  entry.isSecret
                    ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                }`}
                title={entry.isSecret ? 'غیرمخفی کردن' : 'مخفی کردن مقدار'}
              >
                {entry.isSecret ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
              {!defaultKeys.some((dk) => dk.key === entry.key) && (
                <button
                  onClick={() => handleRemoveSetting(index)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add custom setting */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          افزودن تنظیم جدید
        </h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              کلید
            </label>
            <input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              dir="ltr"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="setting_key"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              مقدار
            </label>
            <input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
             placeholder="مقدار"
           />
         </div>
          <div className="flex items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => setNewIsSecret(!newIsSecret)}
              className={`p-2 rounded-lg transition-colors ${
                newIsSecret
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={newIsSecret ? 'مخفی' : 'عادی'}
            >
              {newIsSecret ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={handleAddSetting}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            افزودن
          </button>
        </div>
      </div>

      {/* URL Migration Tool */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">بروزرسانی لینک‌های داخلی</h2>
        <p className="text-sm text-gray-500">
          این ابزار لینک‌های قدیمی داخل محتوای مطالب را بروزرسانی می‌کند:
        </p>
        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 space-y-1" dir="ltr">
          <div><code>/mag/article/</code> → <code>/mag/articles/</code></div>
          <div><code>/mag/review/</code> → <code>/mag/reviews/</code></div>
        </div>
        <p className="text-xs text-gray-400">
          فیلدهای بررسی‌شده: محتوا، خلاصه، توضیحات متا، آدرس کنونیکال، آدرس قدیمی
        </p>

        {migrateError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {migrateError}
          </div>
        )}

        {migrateResult && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {migrateResult}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={checkMigrateUrls}
            disabled={migrateCheckLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {migrateCheckLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            بررسی تعداد
          </button>

          {migrateCount !== null && (
            <span className="text-sm text-gray-600">
              {migrateCount === 0
                ? 'همه لینک‌ها بروز هستند ✓'
                : `${migrateCount.toLocaleString('fa-IR')} مطلب نیاز به بروزرسانی دارد`}
            </span>
          )}

          {migrateCount !== null && migrateCount > 0 && (
            <button
              onClick={runMigrateUrls}
              disabled={migrateLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              {migrateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              اجرای بروزرسانی
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
