import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuthorizedSession } from '@/lib/api-auth'
import {
  deserializeSettingValue,
  isEncryptedSettingValue,
  isSensitiveSettingKey,
  serializeSettingValue,
} from '@/lib/secure-settings'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthorizedSession(request, { requiredRole: 'ADMIN' })
    if (auth.response) {
      return auth.response
    }

    const settings = await prisma.setting.findMany()
    const legacySensitiveSettings: Array<{ id: string; key: string; value: string }> = []

    // Convert to key-value object for convenience
    const settingsMap: Record<string, string> = {}
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

      settingsMap[setting.key] = deserializeSettingValue(setting.key, setting.value)
    }

    if (legacySensitiveSettings.length > 0) {
      await Promise.all(
        legacySensitiveSettings.map((setting) =>
          prisma.setting.update({
            where: { id: setting.id },
            data: { value: serializeSettingValue(setting.key, setting.value) },
          })
        )
      )
    }

    return NextResponse.json(settingsMap)
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

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { error: 'فرمت داده نامعتبر. یک آبجکت key/value ارسال کنید' },
        { status: 400 }
      )
    }

    const entries = Object.entries(body) as [string, string][]

    if (entries.length === 0) {
      return NextResponse.json(
        { error: 'حداقل یک تنظیم ارسال کنید' },
        { status: 400 }
      )
    }

    // Upsert all settings
    const results = await Promise.all(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: serializeSettingValue(key, String(value)) },
          create: { key, value: serializeSettingValue(key, String(value)) },
        })
      )
    )

    // Return updated settings map
    const settingsMap: Record<string, string> = {}
    for (const setting of results) {
      settingsMap[setting.key] = deserializeSettingValue(setting.key, setting.value)
    }

    return NextResponse.json(settingsMap)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'خطا در بروزرسانی تنظیمات' },
      { status: 500 }
    )
  }
}
