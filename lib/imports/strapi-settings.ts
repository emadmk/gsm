import prisma from '@/lib/db'
import {
  deserializeSettingValue,
  serializeSettingValue,
} from '@/lib/secure-settings'
import {
  strapiConnectionSchema,
  strapiConnectionSettingsSchema,
  type StrapiConnectionInput,
  type StrapiConnectionSettingsInput,
} from '@/lib/imports/strapi-schemas'

const STRAPI_SETTING_KEYS = {
  host: 'strapi_import_host',
  port: 'strapi_import_port',
  user: 'strapi_import_user',
  password: 'strapi_import_password',
  database: 'strapi_import_database',
  s3BaseUrl: 'strapi_import_s3_base_url',
} as const

type StrapiSettingKey = keyof typeof STRAPI_SETTING_KEYS

const ALL_STRAPI_SETTING_KEYS = Object.values(STRAPI_SETTING_KEYS)

interface StoredStrapiConnectionResponse {
  connection: {
    host: string
    port: number
    user: string
    database: string
    s3BaseUrl: string
  }
  passwordSaved: boolean
}

function getDefaultConnectionResponse(): StoredStrapiConnectionResponse {
  return {
    connection: {
      host: '',
      port: 3306,
      user: '',
      database: '',
      s3BaseUrl: '',
    },
    passwordSaved: false,
  }
}

async function loadStrapiSettingMap() {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: ALL_STRAPI_SETTING_KEYS,
      },
    },
  })

  const settingsMap = new Map<StrapiSettingKey, string>()

  for (const [field, key] of Object.entries(STRAPI_SETTING_KEYS) as Array<
    [StrapiSettingKey, string]
  >) {
    const match = settings.find((setting) => setting.key === key)
    if (!match) {
      continue
    }

    settingsMap.set(field, deserializeSettingValue(key, match.value))
  }

  return settingsMap
}

export async function getStoredStrapiImportConnectionSettings() {
  const settingsMap = await loadStrapiSettingMap()
  const defaults = getDefaultConnectionResponse()

  return {
    connection: {
      host: settingsMap.get('host') || defaults.connection.host,
      port: Number(settingsMap.get('port') || defaults.connection.port),
      user: settingsMap.get('user') || defaults.connection.user,
      database: settingsMap.get('database') || defaults.connection.database,
      s3BaseUrl: settingsMap.get('s3BaseUrl') || defaults.connection.s3BaseUrl,
    },
    passwordSaved: Boolean(settingsMap.get('password')),
  }
}

export async function saveStoredStrapiImportConnectionSettings(
  rawInput: StrapiConnectionSettingsInput
) {
  const existingSettings = await loadStrapiSettingMap()
  const parsedInput = strapiConnectionSettingsSchema.parse(rawInput)
  const password = parsedInput.password || existingSettings.get('password') || ''

  const connectionResult = strapiConnectionSchema.safeParse({
    ...parsedInput,
    password,
  })

  if (!connectionResult.success) {
    throw new Error(
      connectionResult.error.issues[0]?.message ||
        'تنظیمات اتصال Strapi نامعتبر است'
    )
  }

  const connection = connectionResult.data
  const valuesToStore: Record<StrapiSettingKey, string> = {
    host: connection.host,
    port: String(connection.port),
    user: connection.user,
    password: connection.password,
    database: connection.database,
    s3BaseUrl: connection.s3BaseUrl || '',
  }

  await Promise.all(
    (Object.entries(STRAPI_SETTING_KEYS) as Array<[StrapiSettingKey, string]>).map(
      ([field, key]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: serializeSettingValue(key, valuesToStore[field]) },
          create: { key, value: serializeSettingValue(key, valuesToStore[field]) },
        })
    )
  )

  return getStoredStrapiImportConnectionSettings()
}

export async function resolveStoredStrapiImportConnection(): Promise<StrapiConnectionInput> {
  const settingsMap = await loadStrapiSettingMap()
  const parsed = strapiConnectionSchema.safeParse({
    host: settingsMap.get('host') || '',
    port: Number(settingsMap.get('port') || 3306),
    user: settingsMap.get('user') || '',
    password: settingsMap.get('password') || '',
    database: settingsMap.get('database') || '',
    s3BaseUrl: settingsMap.get('s3BaseUrl') || '',
  })

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ||
        'تنظیمات اتصال Strapi روی سرور کامل نیست'
    )
  }

  return parsed.data
}
