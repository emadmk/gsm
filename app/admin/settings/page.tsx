'use client'

import { useEffect, useState } from 'react'
import { Save, Plus, Trash2, Loader2 } from 'lucide-react'

interface SettingEntry {
  key: string
  value: string
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

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
          // Merge with default keys to ensure they all appear
          const existing = new Map<string, string>(
            Object.entries(data) as [string, string][]
          )
          const entries: SettingEntry[] = []

          // Add default keys first (in order)
          for (const dk of defaultKeys) {
            entries.push({
              key: dk.key,
              value: existing.get(dk.key) || '',
            })
            existing.delete(dk.key)
          }

          // Add remaining custom keys
          for (const [key, value] of existing) {
            entries.push({ key, value })
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
    setSettings((prev) => [...prev, { key: newKey.trim(), value: newValue }])
    setNewKey('')
    setNewValue('')
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
      const payload: Record<string, string> = {}
      for (const entry of settings) {
        payload[entry.key] = entry.value
      }

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'خطا در ذخیره تنظیمات')
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
                <input
                  value={entry.value}
                  onChange={(e) => handleChange(index, e.target.value)}
                  type="text"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              )}
            </div>
            {/* Only allow removing custom keys (not default ones) */}
            {!defaultKeys.some((dk) => dk.key === entry.key) && (
              <button
                onClick={() => handleRemoveSetting(index)}
                className="mt-7 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
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
          <button
            onClick={handleAddSetting}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            افزودن
          </button>
        </div>
      </div>
    </div>
  )
}
