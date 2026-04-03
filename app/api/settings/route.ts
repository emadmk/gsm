import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuthorizedSession } from '@/lib/api-auth'
import {
  deserializeSettingValue,
  isEncryptedSettingValue,
  isSensitiveSettingKey,
  serializeSettingValue,
} from '@/lib/secure-settings'

const MASKED_VALUE = '••••••••'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthorizedSession(request, { requiredRole: 'ADMIN' })
    if (auth.response) {
      return auth.response
    }

    const settings = await prisma.setting.findMany()
    const legacySensitiveSettings: Array<{ id: string; key: string; value: string }> = []

    const result: Array<{ key: string; value: string; isSecret: boolean }> = []

    for (const setting of settings) {
      if (
        isSensitiveSettingKey(setting.key) &&
        setting.value &&
        !isEncryptedSettingValue(setting.value)
      ) {
        legacySensitiveSettings.push({
          id: setting.id,
          key: setting.key,
          value: setting.value,
        })
      }

      const shouldMask = setting.isSecret || isSensitiveSettingKey(setting.key)
      result.push({
        key: setting.key,
        value: shouldMask && setting.value ? MASKED_VALUE : deserializeSettingValue(setting.key, setting.value),
        isSecret: shouldMask,
      })
    }

    if (legacySensitiveSettings.length > 0) {
      await Promise.all(
        legacySensitiveSettings.map((setting) =>
          prisma.setting.update({
            where: { id: setting.id },
            data: {
              value: serializeSettingValue(setting.key, setting.value),
              isSecret: true,
            },
          })
        )
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthorizedSession(request, {
      requiredRole: 'ADMIN',
      enforceSameOrigin: true,
    })
    if (auth.response) {
      return auth.response
    }

    const body = await request.json()

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'فرمت داده نامعتبر' },
        { status: 400 }
      )
    }

    const entries = body as Array<{ key: string; value: string; isSecret: boolean }>

    if (entries.length === 0) {
      return NextResponse.json(
        { error: 'حداقل یک تنظیم ارسال کنید' },
        { status: 400 }
      )
    }

    // Collect keys whose current DB values we need to preserve
    const existingKeys = entries
      .filter((e) => e.value === MASKED_VALUE)
      .map((e) => e.key)

    const existingRecords = existingKeys.length > 0
      ? await prisma.setting.findMany({ where: { key: { in: existingKeys } } })
      : []
    const existingMap = new Map(existingRecords.map((r) => [r.key, r.value]))

    const results = await Promise.all(
      entries.map((entry) => {
        const isMasked = entry.value === MASKED_VALUE
        const shouldEncrypt = entry.isSecret || isSensitiveSettingKey(entry.key)

        // If value is masked, keep the existing encrypted value
        const rawValue = isMasked
          ? (existingMap.get(entry.key) || '')
          : shouldEncrypt
            ? serializeSettingValue(entry.key, String(entry.value))
            : String(entry.value)

        return prisma.setting.upsert({
          where: { key: entry.key },
          update: { value: rawValue, isSecret: shouldEncrypt },
          create: { key: entry.key, value: rawValue, isSecret: shouldEncrypt },
        })
      })
    )

    // Find keys in DB that are NOT in the request → they were deleted
    const sentKeys = new Set(entries.map((e) => e.key))
    const allCurrent = await prisma.setting.findMany({ select: { key: true } })
    const keysToDelete = allCurrent
      .map((r) => r.key)
      .filter((k) => !sentKeys.has(k))

    if (keysToDelete.length > 0) {
      await prisma.setting.deleteMany({ where: { key: { in: keysToDelete } } })
    }

    const response: Array<{ key: string; value: string; isSecret: boolean }> = results.map((r) => ({
      key: r.key,
      value: r.isSecret && r.value ? MASKED_VALUE : deserializeSettingValue(r.key, r.value),
      isSecret: r.isSecret,
    }))

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'خطا در بروزرسانی تنظیمات' },
      { status: 500 }
    )
  }
}
