'use client'

import { useEffect, useState } from 'react'
import { Save, Loader2, Eye, EyeOff, Wifi } from 'lucide-react'

interface MediaSettings {
  s3_provider: string
  s3_endpoint: string
  s3_access_key: string
  s3_secret_key: string
  s3_region: string
  s3_bucket: string
  s3_cdn_url: string
  s3_path_style: string
}

const defaultSettings: MediaSettings = {
  s3_provider: 'MinIO',
  s3_endpoint: '',
  s3_access_key: '',
  s3_secret_key: '',
  s3_region: '',
  s3_bucket: '',
  s3_cdn_url: '',
  s3_path_style: 'false',
}

export default function MediaSettingsPage() {
  const [settings, setSettings] = useState<MediaSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
          setSettings({
            s3_provider: data.s3_provider || defaultSettings.s3_provider,
            s3_endpoint: data.s3_endpoint || defaultSettings.s3_endpoint,
            s3_access_key: data.s3_access_key || defaultSettings.s3_access_key,
            s3_secret_key: data.s3_secret_key || defaultSettings.s3_secret_key,
            s3_region: data.s3_region || defaultSettings.s3_region,
            s3_bucket: data.s3_bucket || defaultSettings.s3_bucket,
            s3_cdn_url: data.s3_cdn_url || defaultSettings.s3_cdn_url,
            s3_path_style: data.s3_path_style || defaultSettings.s3_path_style,
          })
        }
      })
      .catch(() => {
        // error
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSuccess('')
    setError('')

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        setSuccess('تنظیمات با موفقیت ذخیره شد')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('خطا در ذخیره تنظیمات')
      }
    } catch {
      setError('خطا در ذخیره تنظیمات')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setSuccess('')
    setError('')

    try {
      // Save settings first, then test
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        // Attempt a test upload request
        const testRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true }),
        })

        if (testRes.ok) {
          setSuccess('اتصال با موفقیت برقرار شد')
        } else {
          setError('خطا در اتصال به سرور ذخیره‌سازی. لطفا تنظیمات را بررسی کنید')
        }
      } else {
        setError('خطا در ذخیره تنظیمات')
      }
    } catch {
      setError('خطا در تست اتصال')
    } finally {
      setTesting(false)
      setTimeout(() => {
        setSuccess('')
        setError('')
      }, 4000)
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
      <h1 className="text-2xl font-bold text-gray-800">مدیریت رسانه</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-6">تنظیمات ذخیره‌سازی ابری</h2>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ارائه‌دهنده (Provider)
            </label>
            <input
              value={settings.s3_provider}
              onChange={(e) => setSettings({ ...settings, s3_provider: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="MinIO"
              dir="ltr"
            />
          </div>

          {/* Endpoint */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              S3 Endpoint URL
            </label>
            <input
              value={settings.s3_endpoint}
              onChange={(e) => setSettings({ ...settings, s3_endpoint: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="https://s3.example.com"
              dir="ltr"
            />
          </div>

          {/* Access Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Key ID
            </label>
            <input
              value={settings.s3_access_key}
              onChange={(e) => setSettings({ ...settings, s3_access_key: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Access Key ID"
              dir="ltr"
            />
          </div>

          {/* Secret Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secret Access Key
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={settings.s3_secret_key}
                onChange={(e) => setSettings({ ...settings, s3_secret_key: e.target.value })}
                className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Secret Access Key"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              منطقه (Region)
            </label>
            <input
              value={settings.s3_region}
              onChange={(e) => setSettings({ ...settings, s3_region: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="us-east-1"
              dir="ltr"
            />
          </div>

          {/* Bucket */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              نام باکت (Bucket)
            </label>
            <input
              value={settings.s3_bucket}
              onChange={(e) => setSettings({ ...settings, s3_bucket: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="my-bucket"
              dir="ltr"
            />
          </div>

          {/* CDN URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Domain (CDN URL)
            </label>
            <input
              value={settings.s3_cdn_url}
              onChange={(e) => setSettings({ ...settings, s3_cdn_url: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="https://cdn.example.com"
              dir="ltr"
            />
          </div>

          {/* Path Style */}
          <div className="flex items-center gap-3 pt-6">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.s3_path_style === 'true'}
                onChange={(e) =>
                  setSettings({ ...settings, s3_path_style: e.target.checked ? 'true' : 'false' })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className="text-sm font-medium text-gray-700">Use Path-Style Endpoint</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            ذخیره تنظیمات
          </button>
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
            تست اتصال
          </button>
        </div>
      </div>
    </div>
  )
}
