import { ImportRunStatus, Prisma } from '@prisma/client'
import prisma from '@/lib/db'
import {
  runStrapiImport,
  type StrapiConnectionConfig,
  type StrapiImportOptions,
  type StrapiImportProgressEvent,
  type StrapiImportSummary,
} from '@/lib/imports/strapi-importer'

const globalForImports = globalThis as {
  activeStrapiRuns?: Set<string>
  cancelledStrapiRuns?: Set<string>
}

function getActiveStrapiRuns() {
  if (!globalForImports.activeStrapiRuns) {
    globalForImports.activeStrapiRuns = new Set<string>()
  }

  return globalForImports.activeStrapiRuns
}

export function isImportCancelled(runId: string): boolean {
  return globalForImports.cancelledStrapiRuns?.has(runId) ?? false
}

function clearCancellation(runId: string) {
  globalForImports.cancelledStrapiRuns?.delete(runId)
}

function sanitizeJsonValue(value: unknown): unknown {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  if (value === null) {
    return null
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJsonValue(item)) as Prisma.InputJsonArray
  }

  if (typeof value === 'object' && value) {
    const entries = Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([key, entryValue]) => [key, sanitizeJsonValue(entryValue)])

    return Object.fromEntries(entries) as Prisma.InputJsonObject
  }

  return null
}

function formatLogLine(event: StrapiImportProgressEvent) {
  return `[${new Date().toISOString()}] [${event.step}] ${event.message}`
}

export async function markStaleStrapiImportsAsFailed(hours = 12) {
  const staleBefore = new Date(Date.now() - hours * 60 * 60 * 1000)

  await prisma.importRun.updateMany({
    where: {
      sourceType: 'STRAPI',
      status: 'RUNNING',
      updatedAt: { lt: staleBefore },
    },
    data: {
      status: 'FAILED',
      statusMessage: 'این درون‌ریزی به دلیل قدیمی بودن متوقف شد',
      error: 'Stale import run was marked as failed before starting a new job.',
      finishedAt: new Date(),
    },
  })
}

export async function startStrapiImportRun(params: {
  runId: string
  connection: StrapiConnectionConfig
  options: StrapiImportOptions
}) {
  const { runId, connection, options } = params
  const activeRuns = getActiveStrapiRuns()

  if (activeRuns.has(runId)) {
    return
  }

  activeRuns.add(runId)

  let logText = ''
  let latestSummary: Partial<StrapiImportSummary> = {}
  const MAX_LOG_LINES = 500

  const persistProgress = async (event: StrapiImportProgressEvent) => {
    // Check if import was cancelled
    if (isImportCancelled(runId)) {
      throw new Error('درون‌ریزی توسط کاربر لغو شد')
    }

    const newLine = formatLogLine(event)
    if (logText) {
      const lines = logText.split('\n')
      if (lines.length >= MAX_LOG_LINES) {
        lines.splice(0, lines.length - MAX_LOG_LINES + 1)
      }
      lines.push(newLine)
      logText = lines.join('\n')
    } else {
      logText = newLine
    }

    if (event.summary) {
      latestSummary = {
        ...latestSummary,
        ...event.summary,
      }
    }

    await prisma.importRun.update({
      where: { id: runId },
      data: {
        status: ImportRunStatus.RUNNING,
        currentStep: event.step,
        statusMessage: event.message,
        progressCurrent: event.progressCurrent,
        progressTotal: event.progressTotal,
        logText,
        stats:
          Object.keys(latestSummary).length > 0
            ? (sanitizeJsonValue(latestSummary) as Prisma.InputJsonValue)
            : undefined,
      },
    })
  }

  try {
    await prisma.importRun.update({
      where: { id: runId },
      data: {
        status: ImportRunStatus.RUNNING,
        startedAt: new Date(),
        statusMessage: 'در حال شروع درون‌ریزی Strapi',
      },
    })

    const summary = await runStrapiImport({
      prisma,
      connection,
      options,
      onProgress: persistProgress,
    })

    await prisma.importRun.update({
      where: { id: runId },
      data: {
        status: ImportRunStatus.COMPLETED,
        currentStep: 'done',
        statusMessage:
          summary.mode === 'DRY_RUN'
            ? 'Dry run با موفقیت تکمیل شد'
            : 'درون‌ریزی با موفقیت تکمیل شد',
        progressCurrent: summary.source.posts,
        progressTotal: summary.source.posts,
        logText: logText || '[completed] Import finished successfully.',
        stats: sanitizeJsonValue(summary) as Prisma.InputJsonValue,
        finishedAt: new Date(),
        error: null,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'خطای ناشناخته در درون‌ریزی'
    logText = logText
      ? `${logText}\n[${new Date().toISOString()}] [error] ${message}`
      : `[${new Date().toISOString()}] [error] ${message}`

    await prisma.importRun.update({
      where: { id: runId },
      data: {
        status: ImportRunStatus.FAILED,
        currentStep: 'error',
        statusMessage: 'درون‌ریزی با خطا متوقف شد',
        logText,
        error: message,
        stats:
          Object.keys(latestSummary).length > 0
            ? (sanitizeJsonValue(latestSummary) as Prisma.InputJsonValue)
            : undefined,
        finishedAt: new Date(),
      },
    })
  } finally {
    activeRuns.delete(runId)
    clearCancellation(runId)
  }
}
