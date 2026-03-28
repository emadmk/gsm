import { z } from 'zod'

const optionalNumberField = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    return Number.isNaN(parsed) ? value : parsed
  }

  return value
}, z.number().int().nonnegative().optional())

export const strapiConnectionSchema = z.object({
  host: z.string().trim().min(1, 'آدرس سرور Strapi الزامی است'),
  port: z.coerce.number().int().min(1).max(65535).default(3306),
  user: z.string().trim().min(1, 'نام کاربری دیتابیس الزامی است'),
  password: z.string().min(1, 'رمز عبور دیتابیس الزامی است'),
  database: z.string().trim().min(1, 'نام دیتابیس الزامی است'),
  s3BaseUrl: z.string().trim().url('آدرس پایه S3 معتبر نیست').optional().or(z.literal('')),
})

export const strapiImportOptionsSchema = z.object({
  dryRun: z.boolean().default(false),
  skipComments: z.boolean().default(false),
  limit: optionalNumberField,
  offset: optionalNumberField,
  commentLimit: optionalNumberField,
})

export const strapiImportRequestSchema = z.object({
  connection: strapiConnectionSchema,
  options: strapiImportOptionsSchema,
})

export type StrapiConnectionInput = z.infer<typeof strapiConnectionSchema>
export type StrapiImportOptionsInput = z.infer<typeof strapiImportOptionsSchema>
export type StrapiImportRequestInput = z.infer<typeof strapiImportRequestSchema>
