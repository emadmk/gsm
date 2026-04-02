'use client'

import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  FlaskConical,
  Loader2,
  Play,
  RefreshCw,
  Save,
  ShieldCheck,
  TerminalSquare,
  XCircle,
} from 'lucide-react'

type ImportRunStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

interface ImportRunListItem {
  id: string
  status: ImportRunStatus
  sourceHost: string
  sourcePort: number
  sourceDatabase: string
  sourceUser: string
  statusMessage: string | null
  currentStep: string | null
  progressCurrent: number | null
  progressTotal: number | null
  error: string | null
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  updatedAt: string
  stats: ImportSummary | null
  createdBy?: {
    id: string
    name: string | null
    email: string | null
  } | null
}

interface ImportRunDetail extends ImportRunListItem {
  logText: string | null
  options: {
    dryRun?: boolean
    skipComments?: boolean
    limit?: number
    offset?: number
    commentLimit?: number
  } | null
}

interface ImportSummary {
  mode?: 'DRY_RUN' | 'LIVE'
  source?: {
    posts?: number
    tags?: number
    comments?: number
    typeDistribution?: Record<string, number>
  }
  imported?: {
    tags?: number
    categories?: number
    authors?: number
    posts?: number
    comments?: number
    threadedComments?: number
    articleTags?: number
  }
  skipped?: {
    commentsWithoutArticle?: number
  }
  errors?: {
    tags?: number
    categories?: number
    authors?: number
    posts?: number
    comments?: number
    sequenceResets?: number
  }
  target?: {
    articles?: number
    tags?: number
    categories?: number
    authors?: number
    comments?: number
    articleTags?: number
  }
}

interface TestConnectionResult {
  version: string
  source: {
    posts: number
    tags: number
    comments: number
  }
}

interface FormState {
  host: string
  port: string
  user: string
  password: string
  database: string
  s3BaseUrl: string
  dryRun: boolean
  skipComments: boolean
  limit: string
  offset: string
  commentLimit: string
   commentOffset: string
}

const defaultForm: FormState = {
  host: '',
  port: '3306',
  user: '',
  password: '',
  database: '',
  s3BaseUrl: '',
  dryRun: false,
  skipComments: false,
  limit: '',
  offset: '',
  commentLimit: '100000',
   commentOffset: '',
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return undefined

  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? undefined : parsed
}

function formatDateTime(value: string | null) {
  if (!value) return '---'

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getStatusClasses(status: ImportRunStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-50 text-green-700 border-green-200'
    case 'FAILED':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'RUNNING':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200'
  }
}

function getStatusLabel(status: ImportRunStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'تکمیل شده'
    case 'FAILED':
      return 'ناموفق'
    case 'RUNNING':
      return 'در حال اجرا'
    default:
      return 'در انتظار'
  }
}

export default function StrapiImportPage() {
  const [form, setForm] = useState<FormState>(defaultForm)
  const [showPassword, setShowPassword] = useState(false)
  const [runs, setRuns] = useState<ImportRunListItem[]>([])
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [selectedRun, setSelectedRun] = useState<ImportRunDetail | null>(null)
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [loadingRuns, setLoadingRuns] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [startingImport, setStartingImport] = useState(false)
  const [refreshingRun, setRefreshingRun] = useState(false)
  const [cancellingRun, setCancellingRun] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    void loadConfig()
    void loadRuns(false)
  }, [])

  useEffect(() => {
    if (!selectedRunId) {
      setSelectedRun(null)
      return
    }

    void loadRunDetails(selectedRunId, false)
  }, [selectedRunId])

  useEffect(() => {
    const hasRunningImport =
      selectedRun?.status === 'RUNNING' ||
      runs.some((run) => run.status === 'RUNNING')

    if (!hasRunningImport) {
      return
    }

    const interval = window.setInterval(() => {
      void loadRuns(true)
      if (selectedRunId) {
        void loadRunDetails(selectedRunId, true)
      }
    }, 3000)

    return () => window.clearInterval(interval)
  }, [runs, selectedRun?.status, selectedRunId])

  async function loadRuns(keepSelection = true) {
    try {
      if (!keepSelection) {
        setLoadingRuns(true)
      }

      const res = await fetch('/api/imports/strapi')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'خطا در دریافت تاریخچه درون‌ریزی')
      }

      const nextRuns = (data.runs || []) as ImportRunListItem[]
      setRuns(nextRuns)

      if (!keepSelection || !selectedRunId) {
        const nextSelectedId = nextRuns[0]?.id || null
        setSelectedRunId(nextSelectedId)
        return
      }

      if (selectedRunId && !nextRuns.some((run) => run.id === selectedRunId)) {
        setSelectedRunId(nextRuns[0]?.id || null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت تاریخچه')
    } finally {
      setLoadingRuns(false)
    }
  }

  async function loadConfig() {
    try {
      setLoadingConfig(true)

      const res = await fetch('/api/imports/strapi/config')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'خطا در دریافت تنظیمات اتصال')
      }

      setForm((current) => ({
        ...current,
        host: data.connection?.host || '',
        port: String(data.connection?.port || 3306),
        user: data.connection?.user || '',
        password: '',
        database: data.connection?.database || '',
        s3BaseUrl: data.connection?.s3BaseUrl || '',
      }))
      setPasswordSaved(Boolean(data.passwordSaved))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت تنظیمات اتصال')
    } finally {
      setLoadingConfig(false)
    }
  }

  async function loadRunDetails(id: string, silent = false) {
    try {
      if (!silent) {
        setRefreshingRun(true)
      }

      const res = await fetch(`/api/imports/strapi/${id}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'خطا در دریافت جزئیات درون‌ریزی')
      }

      setSelectedRun(data.run as ImportRunDetail)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت جزئیات')
    } finally {
      setRefreshingRun(false)
    }
  }

  function buildConnectionPayload() {
    return {
      host: form.host.trim(),
      port: Number.parseInt(form.port || '3306', 10),
      user: form.user.trim(),
      password: form.password,
      database: form.database.trim(),
      s3BaseUrl: form.s3BaseUrl.trim(),
    }
  }

  function buildOptionsPayload() {
    return {
      dryRun: form.dryRun,
      skipComments: form.skipComments,
      limit: parseOptionalNumber(form.limit),
      offset: parseOptionalNumber(form.offset),
      commentLimit: parseOptionalNumber(form.commentLimit),
       commentOffset: parseOptionalNumber(form.commentOffset),
    }
  }

  async function saveConnection(showSuccessMessage = true) {
    try {
      setSavingConfig(true)

      const res = await fetch('/api/imports/strapi/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildConnectionPayload()),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'ذخیره تنظیمات اتصال ناموفق بود')
      }

      setPasswordSaved(Boolean(data.passwordSaved))
      setForm((current) => ({ ...current, password: '' }))

      if (showSuccessMessage) {
        setSuccess('تنظیمات اتصال Strapi روی سرور ذخیره شد')
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره تنظیمات اتصال')
      return false
    } finally {
      setSavingConfig(false)
    }
  }

  async function handleTestConnection() {
    setTestingConnection(true)
    setError('')
    setSuccess('')
    setTestResult(null)

    try {
      const saved = await saveConnection(false)
      if (!saved) {
        return
      }

      const res = await fetch('/api/imports/strapi/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'اتصال به Strapi برقرار نشد')
      }

      setTestResult(data as TestConnectionResult)
      setSuccess('تنظیمات ذخیره شد و اتصال دیتابیس Strapi با موفقیت بررسی شد')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در تست اتصال')
    } finally {
      setTestingConnection(false)
    }
  }

  async function handleStartImport() {
    setStartingImport(true)
    setError('')
    setSuccess('')

    try {
      const saved = await saveConnection(false)
      if (!saved) {
        return
      }

      const res = await fetch('/api/imports/strapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildOptionsPayload()),
      })

      const data = await res.json()

      if (res.status === 409) {
        setSelectedRunId(data.runId || null)
        throw new Error(data.error || 'یک درون‌ریزی دیگر در حال اجرا است')
      }

      if (!res.ok) {
        throw new Error(data.error || 'شروع درون‌ریزی ناموفق بود')
      }

      const newRunId = data.run?.id as string
      setSelectedRunId(newRunId)
      setSuccess(
        form.dryRun
          ? 'تنظیمات ذخیره شد و Dry run روی سرور شروع شد'
          : 'تنظیمات ذخیره شد و درون‌ریزی Strapi روی سرور شروع شد'
      )
      setForm((current) => ({ ...current, password: '' }))
      await loadRuns(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در شروع درون‌ریزی')
    } finally {
      setStartingImport(false)
    }
  }

  async function handleCancelImport() {
    if (!selectedRunId) return

    setCancellingRun(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/imports/strapi/${selectedRunId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'لغو درون‌ریزی ناموفق بود')
      }

      setSuccess('درون‌ریزی با موفقیت لغو شد')
      await loadRuns(false)
      if (selectedRunId) {
        await loadRunDetails(selectedRunId, false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در لغو درون‌ریزی')
    } finally {
      setCancellingRun(false)
    }
  }

  const summary = selectedRun?.stats || null
  const isSelectedRunRunning = selectedRun?.status === 'RUNNING'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">درون‌ریزی Strapi</h1>
          <p className="mt-1 text-sm text-gray-500">
            تنظیمات اتصال Strapi را روی سرور ذخیره کنید، اتصال را تست کنید و سپس درون‌ریزی را مستقیما از سمت سرور اجرا کنید.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
          رمز دیتابیس به‌صورت رمزنگاری‌شده در سرور ذخیره می‌شود و در مرورگر نگه‌داری نمی‌شود.
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">اتصال دیتابیس Strapi</h2>
                <p className="text-sm text-gray-500">اطلاعات منبع Strapi را برای ذخیره روی سرور، تست اتصال و اجرای درون‌ریزی وارد کنید.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Host</label>
                <input
                  value={form.host}
                  onChange={(event) => setForm({ ...form, host: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="172.30.x.x یا db.example.com"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Port</label>
                <input
                  value={form.port}
                  onChange={(event) => setForm({ ...form, port: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="3306"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Database</label>
                <input
                  value={form.database}
                  onChange={(event) => setForm({ ...form, database: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="blog_gsm_production"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">User</label>
                <input
                  value={form.user}
                  onChange={(event) => setForm({ ...form, user: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="db_user"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pl-11 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      passwordSaved
                        ? 'برای نگه‌داشتن رمز فعلی، این فیلد را خالی بگذارید'
                        : 'رمز برای ذخیره روی سرور لازم است'
                    }
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordSaved && !form.password && (
                  <p className="mt-2 text-xs text-emerald-600">
                    رمز فعلی روی سرور ذخیره شده است.
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  S3 Base URL
                  <span className="mr-2 text-xs text-gray-400">اختیاری</span>
                </label>
                <input
                  value={form.s3BaseUrl}
                  onChange={(event) => setForm({ ...form, s3BaseUrl: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="https://s3.example.com/bucket"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-800">گزینه‌های درون‌ریزی</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.dryRun}
                  onChange={(event) => setForm({ ...form, dryRun: event.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Dry run
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.skipComments}
                  onChange={(event) => setForm({ ...form, skipComments: event.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                عدم انتقال نظرات
              </label>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Limit
                  <span className="mr-2 text-xs text-gray-400">اختیاری</span>
                </label>
                <input
                  value={form.limit}
                  onChange={(event) => setForm({ ...form, limit: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Offset
                  <span className="mr-2 text-xs text-gray-400">اختیاری</span>
                </label>
                <input
                  value={form.offset}
                  onChange={(event) => setForm({ ...form, offset: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  dir="ltr"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Comment Limit
                  <span className="mr-2 text-xs text-gray-400">پیش‌فرض 100000</span>
                </label>
                <input
                  value={form.commentLimit}
                  onChange={(event) => setForm({ ...form, commentLimit: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="100000"
                  dir="ltr"
                />
              </div>

               <div className="md:col-span-2">
                 <label className="mb-1 block text-sm font-medium text-gray-700">
                   Comment Offset
                   <span className="mr-2 text-xs text-gray-400">اختیاری</span>
                 </label>
                 <input
                   value={form.commentOffset}
                   onChange={(event) => setForm({ ...form, commentOffset: event.target.value })}
                   className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                   placeholder="0"
                   dir="ltr"
                 />
               </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setError('')
                  setSuccess('')
                  setTestResult(null)
                  void saveConnection(true)
                }}
                disabled={loadingConfig || savingConfig || testingConnection || startingImport}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingConfig ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                ذخیره روی سرور
              </button>

              <button
                onClick={handleTestConnection}
                disabled={loadingConfig || savingConfig || testingConnection || startingImport}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {testingConnection ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FlaskConical className="h-4 w-4" />
                )}
                تست اتصال
              </button>

              <button
                onClick={handleStartImport}
                disabled={loadingConfig || savingConfig || startingImport || testingConnection}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {startingImport ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {form.dryRun ? 'شروع Dry Run' : 'شروع درون‌ریزی'}
              </button>
            </div>

            {loadingConfig && (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                در حال دریافت تنظیمات ذخیره‌شده از سرور...
              </div>
            )}

            {testResult && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">اتصال معتبر است</span>
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm text-emerald-800 md:grid-cols-4">
                  <div>
                    <div className="text-xs text-emerald-600">MySQL Version</div>
                    <div className="mt-1 font-semibold" dir="ltr">{testResult.version}</div>
                  </div>
                  <div>
                    <div className="text-xs text-emerald-600">Posts</div>
                    <div className="mt-1 font-semibold">{testResult.source.posts.toLocaleString('fa-IR')}</div>
                  </div>
                  <div>
                    <div className="text-xs text-emerald-600">Tags</div>
                    <div className="mt-1 font-semibold">{testResult.source.tags.toLocaleString('fa-IR')}</div>
                  </div>
                  <div>
                    <div className="text-xs text-emerald-600">Comments</div>
                    <div className="mt-1 font-semibold">{testResult.source.comments.toLocaleString('fa-IR')}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <TerminalSquare className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">وضعیت اجرا</h2>
                  <p className="text-sm text-gray-500">آخرین لاگ‌ها و جزئیات اجرای انتخاب‌شده</p>
                </div>
              </div>

              {selectedRunId && (
                <div className="flex items-center gap-2">
                  {isSelectedRunRunning && (
                    <button
                      onClick={() => void handleCancelImport()}
                      disabled={cancellingRun}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      {cancellingRun ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      لغو
                    </button>
                  )}
                  <button
                    onClick={() => void loadRunDetails(selectedRunId, false)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                  >
                    {refreshingRun ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    بروزرسانی
                  </button>
                </div>
              )}
            </div>

            {!selectedRun ? (
              <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center text-sm text-gray-500">
                هنوز اجرایی انتخاب نشده است.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(selectedRun.status)}`}
                  >
                    {getStatusLabel(selectedRun.status)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {selectedRun.statusMessage || '---'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="text-xs text-gray-400">منبع</div>
                    <div className="mt-1 font-medium text-gray-800" dir="ltr">
                      {selectedRun.sourceUser}@{selectedRun.sourceHost}:{selectedRun.sourcePort}
                    </div>
                    <div className="mt-1 text-gray-600" dir="ltr">{selectedRun.sourceDatabase}</div>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="text-xs text-gray-400">زمان‌ها</div>
                    <div className="mt-1 text-gray-700">ایجاد: {formatDateTime(selectedRun.createdAt)}</div>
                    <div className="mt-1 text-gray-700">شروع: {formatDateTime(selectedRun.startedAt)}</div>
                    <div className="mt-1 text-gray-700">پایان: {formatDateTime(selectedRun.finishedAt)}</div>
                  </div>
                </div>

                {typeof selectedRun.progressCurrent === 'number' && typeof selectedRun.progressTotal === 'number' && selectedRun.progressTotal > 0 && (
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
                      <span>پیشرفت</span>
                      <span>
                        {selectedRun.progressCurrent.toLocaleString('fa-IR')} / {selectedRun.progressTotal.toLocaleString('fa-IR')}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((selectedRun.progressCurrent / selectedRun.progressTotal) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {summary && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 p-4">
                      <div className="mb-2 text-sm font-semibold text-gray-800">آمار منبع</div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>مطالب: {(summary.source?.posts || 0).toLocaleString('fa-IR')}</div>
                        <div>تگ‌ها: {(summary.source?.tags || 0).toLocaleString('fa-IR')}</div>
                        <div>نظرات: {(summary.source?.comments || 0).toLocaleString('fa-IR')}</div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4">
                      <div className="mb-2 text-sm font-semibold text-gray-800">خروجی اجرا</div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>مطالب: {(summary.imported?.posts || 0).toLocaleString('fa-IR')}</div>
                        <div>نظرات: {(summary.imported?.comments || 0).toLocaleString('fa-IR')}</div>
                        <div>تگ‌ها: {(summary.imported?.tags || 0).toLocaleString('fa-IR')}</div>
                        <div>خطاها: {((summary.errors?.posts || 0) + (summary.errors?.comments || 0) + (summary.errors?.tags || 0) + (summary.errors?.categories || 0) + (summary.errors?.authors || 0)).toLocaleString('fa-IR')}</div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedRun.error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <div className="mb-1 flex items-center gap-2 font-medium">
                      <AlertCircle className="h-4 w-4" />
                      خطای اجرا
                    </div>
                    <div dir="ltr" className="break-all text-xs">{selectedRun.error}</div>
                  </div>
                )}

                <div>
                  <div className="mb-2 text-sm font-semibold text-gray-800">لاگ اجرا</div>
                  <pre className="max-h-[420px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100 whitespace-pre-wrap">
                    {selectedRun.logText || 'هنوز لاگی ثبت نشده است.'}
                  </pre>
                </div>

                {isSelectedRunRunning && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    این اجرا در حال انجام است و صفحه به صورت خودکار بروزرسانی می‌شود.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">تاریخچه اجراها</h2>
                <p className="text-sm text-gray-500">آخرین اجراهای Strapi در این پنل</p>
              </div>
              <button
                onClick={() => void loadRuns(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
              >
                {loadingRuns ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                بروزرسانی
              </button>
            </div>

            {loadingRuns ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : runs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center text-sm text-gray-500">
                هنوز هیچ اجرای Strapi ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-3">
                {runs.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => setSelectedRunId(run.id)}
                    className={`w-full rounded-2xl border p-4 text-right transition ${
                      selectedRunId === run.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(run.status)}`}
                          >
                            {getStatusLabel(run.status)}
                          </span>
                          <span className="text-sm font-medium text-gray-800" dir="ltr">
                            {run.sourceDatabase}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600" dir="ltr">
                          {run.sourceUser}@{run.sourceHost}:{run.sourcePort}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {run.statusMessage || '---'}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        <div>ایجاد: {formatDateTime(run.createdAt)}</div>
                        <div className="mt-1">بروزرسانی: {formatDateTime(run.updatedAt)}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
