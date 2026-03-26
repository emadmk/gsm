import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/db'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const settings = await prisma.setting.findMany()

    // Convert to key-value object for convenience
    const settingsMap: Record<string, string> = {}
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value
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
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    )

    // Return updated settings map
    const settingsMap: Record<string, string> = {}
    for (const setting of results) {
      settingsMap[setting.key] = setting.value
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
